const mongoose = require("mongoose");

// Every field below mirrors an Open-Meteo daily value or an hourly-aggregated-to-daily one
// (see lib/openmeteo.js). They're all nullable because upstream data legitimately comes
// back null sometimes — pollen especially, which only has model coverage in Europe — and a
// missing value for one field shouldn't block storing the rest of that day's row.
const envDailySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // Stored as "YYYY-MM-DD" rather than a Date so the userId+date join against entries in
  // lib/correlate.js and routes/env.js is a plain string comparison, with no timezone
  // conversion involved on either side.
  date: { type: String, required: true },

  temperature_2m_max: { type: Number, default: null },
  temperature_2m_min: { type: Number, default: null },
  temperature_2m_mean: { type: Number, default: null },
  relative_humidity_2m_mean: { type: Number, default: null },
  surface_pressure_mean: { type: Number, default: null },
  precipitation_sum: { type: Number, default: null },
  rain_sum: { type: Number, default: null },
  wind_speed_10m_max: { type: Number, default: null },
  wind_gusts_10m_max: { type: Number, default: null },
  weather_code: { type: Number, default: null },
  // No uv_index_max: Open-Meteo's archive endpoint never computes it (always null there,
  // even when other fields are populated) and the forecast endpoint only carries real UV
  // for a shifting ~2-month window — not a reliable enough source to store. See
  // lib/openmeteo.js for the full explanation.

  pm2_5: { type: Number, default: null },
  pm10: { type: Number, default: null },
  ozone: { type: Number, default: null },
  nitrogen_dioxide: { type: Number, default: null },
  alder_pollen: { type: Number, default: null },
  birch_pollen: { type: Number, default: null },
  grass_pollen: { type: Number, default: null },
  mugwort_pollen: { type: Number, default: null },
  ragweed_pollen: { type: Number, default: null },

  // Derived fields — see lib/openmeteo.js for how these are computed.
  thunderstorm: { type: Boolean, default: false },
  pressure_change: { type: Number, default: null },
});

// One row per user per day. lib/backfill.js upserts on this index, so re-running a backfill
// (a cron, or a user changing their saved location) overwrites that day's row instead of
// creating duplicates.
envDailySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("EnvDaily", envDailySchema);
