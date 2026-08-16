const Episode = require("../models/Episode");
const EnvDaily = require("../models/EnvDaily");
const User = require("../models/User");

// Minimum matched episode-day observations before a candidate variable is even considered.
// Below this, a mean is mostly noise — "10 observations for meaningful comparison" is the
// spec's own bar; we also require the *baseline* side to clear it independently.
const MIN_SAMPLE = 10;
// Effect size floor (in baseline standard deviations) before something is worth phrasing as
// a pattern at all, even once the sample size is large enough — a huge sample with a tiny
// effect isn't a "pattern," it's just precise measurement of "no real difference."
const MIN_EFFECT_SIZE = 0.4;

// Which environmental variables are even candidates per symptom category — this is what
// keeps, e.g., stomach symptoms from ever surfacing weather or pollen as a "likely cause":
// there's no candidate list for them to be pulled from in the first place.
const CATEGORY_VARIABLES = {
  nose: ["alder_pollen", "birch_pollen", "grass_pollen", "mugwort_pollen", "ragweed_pollen", "pm2_5", "pm10", "relative_humidity_2m_mean"],
  eyes: ["alder_pollen", "birch_pollen", "grass_pollen", "mugwort_pollen", "ragweed_pollen", "pm2_5", "ozone"],
  skin: ["relative_humidity_2m_mean", "temperature_2m_mean", "pressure_change"],
  hives: ["temperature_2m_mean", "relative_humidity_2m_mean", "pressure_change"],
  swelling: ["pressure_change", "relative_humidity_2m_mean"],
  breathing: ["pm2_5", "pm10", "ozone", "nitrogen_dioxide", "alder_pollen", "birch_pollen", "grass_pollen", "mugwort_pollen", "ragweed_pollen", "relative_humidity_2m_mean"],
  mouth_throat: ["alder_pollen", "birch_pollen", "grass_pollen", "mugwort_pollen", "ragweed_pollen", "pm2_5", "relative_humidity_2m_mean"],
  // Intentionally empty: no physiological pathway from ambient weather/air-quality readings to
  // stomach symptoms is being modeled here, so no candidate variable is ever offered — see
  // server/API.md and the item 6 requirement this encodes.
  stomach: [],
};

const FIELD_LABELS = {
  alder_pollen: "alder pollen",
  birch_pollen: "birch pollen",
  grass_pollen: "grass pollen",
  mugwort_pollen: "mugwort pollen",
  ragweed_pollen: "ragweed pollen",
  pm2_5: "fine particulate (PM2.5)",
  pm10: "coarse particulate (PM10)",
  ozone: "ozone",
  nitrogen_dioxide: "nitrogen dioxide",
  relative_humidity_2m_mean: "humidity",
  temperature_2m_mean: "temperature",
  pressure_change: "pressure swings",
};

function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values, m) {
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function buildMessage(name, field, direction) {
  const lowerName = name.toLowerCase();
  if (field === "pressure_change") {
    const phrase = direction === "lower" ? "sharper pressure drops" : "rising-pressure periods";
    return `Your ${lowerName} episodes have been more common during ${phrase}.`;
  }
  const label = FIELD_LABELS[field] || field;
  return `Your ${lowerName} episodes have been more common during ${direction}-${label} periods.`;
}

// Compares episode-time environmental values against the user's own full baseline (every
// observed day, episode or not — see models/EnvDaily.js) for each candidate variable their
// symptom's category allows, and surfaces the strongest one that clears both the sample-size
// and effect-size floors. No LLM, no causal language — just descriptive statistics computed
// the same way every time from the same inputs.
async function computePatterns(userId) {
  const [episodes, envRows, user] = await Promise.all([
    Episode.find({ userId }),
    EnvDaily.find({ userId }),
    User.findById(userId),
  ]);

  const envByDate = new Map(envRows.map((r) => [r.date, r]));

  // Group episode calendar-dates by symptomId, using the CURRENT tracked-symptom category
  // (falling back to the episode's own snapshot if the symptom was later removed) — active
  // symptoms should reflect their current category even if it was edited after some episodes
  // were logged; removed symptoms still get analyzed using their last-known category.
  const trackedById = new Map((user.trackedSymptoms || []).map((s) => [s.id, s]));
  const bySymptom = new Map();
  for (const ep of episodes) {
    const dateStr = ep.date.toISOString().slice(0, 10);
    for (const s of ep.symptoms) {
      if (!bySymptom.has(s.symptomId)) {
        const tracked = trackedById.get(s.symptomId);
        bySymptom.set(s.symptomId, {
          symptomId: s.symptomId,
          name: tracked ? tracked.name : s.name,
          category: tracked ? tracked.category : s.category,
          dates: [],
        });
      }
      bySymptom.get(s.symptomId).dates.push(dateStr);
    }
  }

  const findings = [];
  const stillLearning = [];

  for (const { symptomId, name, category, dates } of bySymptom.values()) {
    const variables = CATEGORY_VARIABLES[category] || [];
    if (variables.length === 0) {
      stillLearning.push({ symptomId, name, category, nEpisodes: dates.length, reason: "category_not_evaluated" });
      continue;
    }

    let best = null;
    for (const field of variables) {
      const baselineValues = envRows.map((r) => r[field]).filter((v) => v !== null && v !== undefined);
      const episodeValues = dates
        .map((d) => envByDate.get(d))
        .filter(Boolean)
        .map((r) => r[field])
        .filter((v) => v !== null && v !== undefined);

      if (episodeValues.length < MIN_SAMPLE || baselineValues.length < MIN_SAMPLE) continue;

      const baselineMean = mean(baselineValues);
      const baselineSd = stdDev(baselineValues, baselineMean);
      if (baselineSd === 0) continue; // no spread in the baseline to compare against

      const episodeMean = mean(episodeValues);
      const effectSize = (episodeMean - baselineMean) / baselineSd;
      if (Math.abs(effectSize) < MIN_EFFECT_SIZE) continue;

      const direction = effectSize > 0 ? "higher" : "lower";
      const support = episodeValues.length >= 20 ? "strong" : episodeValues.length >= 14 ? "moderate" : "limited";

      const candidate = {
        symptomId,
        symptomName: name,
        field,
        fieldLabel: FIELD_LABELS[field] || field,
        nEpisodes: episodeValues.length,
        nBaseline: baselineValues.length,
        baselineMean: Number(baselineMean.toFixed(2)),
        episodeMean: Number(episodeMean.toFixed(2)),
        effectSize: Number(effectSize.toFixed(2)),
        support,
        direction,
        message: buildMessage(name, field, direction),
      };

      if (!best || Math.abs(candidate.effectSize) > Math.abs(best.effectSize)) {
        best = candidate;
      }
    }

    if (best) {
      findings.push(best);
    } else {
      stillLearning.push({ symptomId, name, category, nEpisodes: dates.length, reason: "below_threshold" });
    }
  }

  findings.sort((a, b) => Math.abs(b.effectSize) - Math.abs(a.effectSize));

  return {
    findings,
    stillLearning,
    disclaimer: "Possible pattern, not a medical diagnosis.",
    minSample: MIN_SAMPLE,
  };
}

module.exports = { computePatterns, CATEGORY_VARIABLES, MIN_SAMPLE, MIN_EFFECT_SIZE };
