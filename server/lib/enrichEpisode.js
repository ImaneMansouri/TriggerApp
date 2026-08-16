const Episode = require("../models/Episode");
const EnvDaily = require("../models/EnvDaily");
const User = require("../models/User");
const { ensureFreshData } = require("./envIngest");

const CONTEXT_FIELDS = [
  "temperature_2m_mean",
  "relative_humidity_2m_mean",
  "surface_pressure_mean",
  "pressure_change",
  "pm2_5",
  "pm10",
  "ozone",
  "nitrogen_dioxide",
  "alder_pollen",
  "birch_pollen",
  "grass_pollen",
  "mugwort_pollen",
  "ragweed_pollen",
  "thunderstorm",
];

// Fills in an episode's environmentalContext AFTER it's already been saved. Called
// fire-and-forget from routes/episodes.js — never awaited by the request handler — so a slow
// or failing Open-Meteo call can never block or fail the episode save itself (item 3). Every
// exit path here ends in a `status`, never a thrown error the caller has to handle.
async function enrichEpisode(episodeId) {
  const episode = await Episode.findById(episodeId);
  if (!episode) return;

  try {
    const user = await User.findById(episode.userId);
    if (!user || user.lat == null || user.lon == null) {
      episode.environmentalContext.status = "unavailable";
      await episode.save();
      return;
    }

    const dateStr = episode.date.toISOString().slice(0, 10);
    let row = await EnvDaily.findOne({ userId: episode.userId, date: dateStr });

    if (!row) {
      // Best-effort: try to fetch it now. If Open-Meteo is down, this just throws/returns
      // nothing and we fall through to "unavailable" below — never back to the caller.
      await ensureFreshData(episode.userId).catch(() => {});
      row = await EnvDaily.findOne({ userId: episode.userId, date: dateStr });
    }

    if (!row) {
      episode.environmentalContext.status = "unavailable";
      episode.environmentalContext.capturedAt = new Date();
      await episode.save();
      return;
    }

    const data = {};
    let missing = 0;
    for (const field of CONTEXT_FIELDS) {
      const value = row[field];
      data[field] = value === undefined ? null : value;
      if (data[field] === null) missing++;
    }

    episode.environmentalContext.data = data;
    episode.environmentalContext.status =
      missing === 0 ? "complete" : missing === CONTEXT_FIELDS.length ? "unavailable" : "partial";
    episode.environmentalContext.capturedAt = new Date();
    await episode.save();
  } catch (err) {
    // Whatever went wrong (network, DB, anything) — the episode is already saved. Mark
    // enrichment as unavailable and stop; never propagate this as a failure.
    console.error(`[enrichEpisode] failed for episode ${episodeId}:`, err.message);
    try {
      episode.environmentalContext.status = "unavailable";
      episode.environmentalContext.capturedAt = new Date();
      await episode.save();
    } catch {
      // Even the fallback save failed (e.g. DB blip) — nothing more we can safely do here.
    }
  }
}

module.exports = { enrichEpisode, CONTEXT_FIELDS };
