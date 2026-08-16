require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Episode = require("../models/Episode");
const EnvDaily = require("../models/EnvDaily");
const { backfillUser } = require("../lib/backfill");
const { enrichEpisode } = require("../lib/enrichEpisode");
const { computePatterns } = require("../lib/patternEngine");

const DEMO_EMAIL = "demo@triggerapp.com";
const DEMO_PASSWORD = "demo123";
const SEED_DAYS = 75;

// Davenport, Iowa — a real US location. Pollen coverage is Europe-only in Open-Meteo's air
// quality model (see lib/openmeteo.js), so every pollen field comes back null here, every
// day — that's expected, and lets the demo also show what "no data for this variable" looks
// like, not just clean signal.
const DEMO_LAT = 41.52;
const DEMO_LON = -90.58;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function percentileThreshold(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * p)];
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    await Promise.all([
      Episode.deleteMany({ userId: existing._id }),
      EnvDaily.deleteMany({ userId: existing._id }),
      User.deleteOne({ _id: existing._id }),
    ]);
    console.log("Removed existing demo user and data");
  }

  const trackedSymptoms = [
    { id: crypto.randomUUID(), name: "Hives", category: "hives", active: true },
    { id: crypto.randomUUID(), name: "Wheezing", category: "breathing", active: true },
    { id: crypto.randomUUID(), name: "Stomach ache", category: "stomach", active: true },
    { id: crypto.randomUUID(), name: "Itchy eyes", category: "eyes", active: true },
  ];

  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await User.create({
    email: DEMO_EMAIL,
    password: hashed,
    lat: DEMO_LAT,
    lon: DEMO_LON,
    conditions: ["seasonal allergies"],
    username: "Demo User",
    age: 29,
    avatar: "fox",
    trackedSymptoms,
    preferences: { hasEpinephrine: true, acknowledgedDisclaimer: true },
    isDemo: true,
  });
  console.log(`Created demo user ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  // Backfill first so episode generation below can read *real* humidity/ozone/pm2.5 values
  // for this location and bias which days get an episode — not the other way around.
  const rowsWritten = await backfillUser(user._id, SEED_DAYS);
  console.log(`Backfilled ${rowsWritten} days of environmental data`);

  const envRows = await EnvDaily.find({ userId: user._id }).sort({ date: 1 });
  const humidityValues = envRows.map((r) => r.relative_humidity_2m_mean).filter((v) => v !== null);
  const ozoneValues = envRows.map((r) => r.ozone).filter((v) => v !== null);
  const pm25Values = envRows.map((r) => r.pm2_5).filter((v) => v !== null);
  const humidityHigh = percentileThreshold(humidityValues, 0.6);
  const ozoneHigh = percentileThreshold(ozoneValues, 0.72);
  const pm25High = percentileThreshold(pm25Values, 0.65);

  const [hives, wheezing, stomachAche, itchyEyes] = trackedSymptoms;
  const episodeDocs = [];

  for (const env of envRows) {
    const dateObj = new Date(`${env.date}T14:00:00Z`);

    // Hives: deliberately concentrated on higher-humidity days, so the pattern engine has a
    // real episodeMean-vs-baselineMean gap on relative_humidity_2m_mean to detect — nothing
    // downstream hardcodes this relationship, it has to actually be found in the numbers.
    const humid = env.relative_humidity_2m_mean;
    const hivesChance = humid !== null && humid >= humidityHigh ? 0.6 : 0.12;
    if (Math.random() < hivesChance) {
      episodeDocs.push({ symptomId: hives.id, name: hives.name, category: hives.category, severity: randInt(2, 5), date: dateObj });
    }

    // Wheezing: concentrated on days with elevated ozone OR elevated PM2.5 — both are
    // respiratory irritants, so triggering on either is the physiologically plausible pairing
    // (not humidity, which has no such relationship to airway constriction). Ozone and
    // humidity are naturally anti-correlated in this region's summer weather (hot, sunny,
    // low-humidity days are exactly when ozone forms), so a narrower ozone-only bias left an
    // incidental humidity effect strong enough to occasionally outrank the intended signal —
    // biasing on two irritants at once, with a wider probability contrast, keeps the real
    // signal dominant regardless of that confound.
    const ozone = env.ozone;
    const pm25 = env.pm2_5;
    // Additive, not a flat OR: a day elevated on just one pollutant still gets a push, and a
    // day elevated on both (the physiologically worst air-quality days) gets pushed hardest.
    // Ozone gets the larger weight deliberately: PM2.5 and PM10 are ~0.99-correlated in this
    // region's real Open-Meteo data (same particulate event, two measurements of it), so a
    // PM2.5-only bias inevitably drags PM10 up just as much — sometimes more — and the
    // pattern engine (checking every category-relevant field, PM10 included, per
    // lib/patternEngine.js's CATEGORY_VARIABLES) has no way to prefer the "intended" one
    // between two that collinear. Ozone has no such near-duplicate, so weighting it higher
    // keeps it the dominant, reliably-surfaced signal while PM2.5 still carries a real
    // secondary effect.
    let wheezeChance = 0.05;
    if (ozone !== null && ozone >= ozoneHigh) wheezeChance += 0.65;
    if (pm25 !== null && pm25 >= pm25High) wheezeChance += 0.12;
    wheezeChance = Math.min(wheezeChance, 0.85);
    if (Math.random() < wheezeChance) {
      episodeDocs.push({ symptomId: wheezing.id, name: wheezing.name, category: wheezing.category, severity: randInt(2, 4), date: dateObj });
    }

    // Stomach ache: purely random, no environmental relationship at all — this is the
    // category-gating proof: `stomach` has zero candidate variables in the pattern engine
    // (see lib/patternEngine.js), so this should always land in `stillLearning`, never in
    // `findings`, no matter how the random draws happen to fall.
    if (Math.random() < 0.18) {
      episodeDocs.push({ symptomId: stomachAche.id, name: stomachAche.name, category: stomachAche.category, severity: randInt(1, 5), date: dateObj });
    }

    // Itchy eyes: random and infrequent — with pollen null at this location, the only
    // candidate variables it has left (pm2_5, ozone) rarely clear the sample threshold at
    // this occurrence rate, so this mostly demonstrates "We're still learning your patterns."
    if (Math.random() < 0.15) {
      episodeDocs.push({ symptomId: itchyEyes.id, name: itchyEyes.name, category: itchyEyes.category, severity: randInt(1, 3), date: dateObj });
    }
  }

  // Group same-day symptoms into single multi-symptom episodes some of the time, purely so
  // the demo account also shows what a multi-symptom episode looks like in History/Detail —
  // otherwise every seeded episode would be single-symptom, which is a real but boring case.
  const byDate = new Map();
  for (const s of episodeDocs) {
    const key = s.date.toISOString();
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(s);
  }

  const LOCATIONS = ["indoor", "outdoor", "both", "unknown"];
  const episodesToInsert = [...byDate.entries()].map(([iso, symptomsForDay]) => ({
    userId: user._id,
    date: new Date(iso),
    symptoms: symptomsForDay.map(({ symptomId, name, category, severity }) => ({ symptomId, name, category, severity })),
    location: pick(LOCATIONS),
    environmentalContext: { status: "pending" },
    safety: { flagged: false, reasons: [] },
    isDemo: true,
  }));

  const inserted = await Episode.insertMany(episodesToInsert);
  console.log(`Created ${inserted.length} episodes (${episodeDocs.length} symptom-occurrences)`);

  // Run every seeded episode through the exact same enrichment path a real save uses, so demo
  // data's environmentalContext is populated the same way — not specially pre-filled.
  for (const episode of inserted) {
    await enrichEpisode(episode._id);
  }
  console.log("Enriched all seeded episodes with environmental context");

  const patterns = await computePatterns(user._id);
  console.log("\nPattern engine output (computed from the seeded data, not hardcoded):");
  if (patterns.findings.length === 0) {
    console.log("  No findings cleared the sample/effect-size threshold this run (random seed data varies run to run).");
  }
  for (const f of patterns.findings) {
    console.log(`  [${f.support}] ${f.message} (n=${f.nEpisodes} episodes vs n=${f.nBaseline} baseline days, effect size ${f.effectSize})`);
  }
  console.log("  Still learning:", patterns.stillLearning.map((s) => `${s.name} (${s.reason})`).join(", "));

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
