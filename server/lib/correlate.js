const Entry = require("../models/Entry");
const EnvDaily = require("../models/EnvDaily");

const ENV_FIELDS = [
  "temperature_2m_max",
  "temperature_2m_min",
  "temperature_2m_mean",
  "relative_humidity_2m_mean",
  "surface_pressure_mean",
  "precipitation_sum",
  "rain_sum",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "weather_code",
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
  "pressure_change",
];

// A correlation computed from a handful of days is mostly noise, not signal — 10 is a
// common rule-of-thumb floor for a Pearson r to be worth reporting at all.
const MIN_OBSERVATIONS = 10;

// Pearson's r for paired samples x (severity) and y (one env field), computed by hand:
//
//   r = Σ (xi - x̄)(yi - ȳ)  /  sqrt( Σ(xi - x̄)² · Σ(yi - ȳ)² )
//
// The numerator is the covariance of x and y — do they move together, and by how much?
// Each factor under the square root is one variable's own variance (its spread around its
// mean). Dividing covariance by the product of the two standard deviations rescales it into
// the fixed [-1, 1] range, which is what makes an r for "severity vs. temperature in °C"
// comparable to an r for "severity vs. pressure in hPa" even though the raw units differ.
function pearson(pairs) {
  const n = pairs.length;
  const meanX = pairs.reduce((sum, [x]) => sum + x, 0) / n;
  const meanY = pairs.reduce((sum, [, y]) => sum + y, 0) / n;

  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;
  for (const [x, y] of pairs) {
    const dx = x - meanX;
    const dy = y - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  // denominator is 0 when severity or the env field is constant across every paired day
  // (zero variance) — correlation is undefined there, not zero, so the caller drops the field.
  if (denominator === 0) {
    return null;
  }
  return numerator / denominator;
}

// Joins each symptom entry to that day's environmental row (by userId + calendar date, via
// EnvDaily's "YYYY-MM-DD" string key) and computes how each env field correlates with
// reported severity across all matched days.
async function computeCorrelations(userId) {
  const [entries, envRows] = await Promise.all([Entry.find({ userId }), EnvDaily.find({ userId })]);

  const envByDate = new Map(envRows.map((row) => [row.date, row]));

  const pairsByField = new Map(ENV_FIELDS.map((field) => [field, []]));

  for (const entry of entries) {
    const date = entry.date.toISOString().slice(0, 10);
    const env = envByDate.get(date);
    if (!env) continue;

    for (const field of ENV_FIELDS) {
      let value = env[field];
      if (typeof value === "boolean") value = value ? 1 : 0; // thunderstorm -> 0/1 for Pearson
      if (value === null || value === undefined) continue;
      pairsByField.get(field).push([entry.severity, value]);
    }
  }

  const results = [];
  for (const [field, pairs] of pairsByField) {
    if (pairs.length < MIN_OBSERVATIONS) continue;
    const r = pearson(pairs);
    if (r === null) continue;
    results.push({ field, r: Number(r.toFixed(4)), n: pairs.length });
  }

  results.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  return results;
}

module.exports = { computeCorrelations, ENV_FIELDS };
