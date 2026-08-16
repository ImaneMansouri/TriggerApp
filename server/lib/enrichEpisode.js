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

// Fills in an episode's environmentalContext after it's already been saved.
// Every exit path ends in a "status", so never throws an error to the caller.
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
      // If Open-Meteo is down, caller recieves "unavailable"
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
    // Episodes are never marked as a failure and always saved
    // Callers can retry later
    console.error(`[enrichEpisode] failed for episode ${episodeId}:`, err.message);
    try {
      episode.environmentalContext.status = "unavailable";
      episode.environmentalContext.capturedAt = new Date();
      await episode.save();
    } catch {
      // fallback save failed
    }
  }
}

module.exports = { enrichEpisode, CONTEXT_FIELDS };
