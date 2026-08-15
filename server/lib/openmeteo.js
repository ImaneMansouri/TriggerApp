const ARCHIVE_HOST = "https://archive-api.open-meteo.com/v1/archive";
const FORECAST_HOST = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_HOST = "https://air-quality-api.open-meteo.com/v1/air-quality";

// Open-Meteo's historical archive is backed by a reanalysis model that takes a few days to
// produce, so requests for very recent dates come back thin or empty. Anything newer than
// this cutoff is pulled from the forecast endpoint instead, which blends observed + modeled
// data and is always current through today.
const ARCHIVE_LAG_DAYS = 5;

const WEATHER_DAILY_FIELDS = [
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
];
// uv_index_max was dropped: the archive endpoint's reanalysis model never computes it (it
// comes back null on every date, even when other fields like shortwave_radiation_sum are
// populated), and the forecast endpoint only has real values for roughly the last two
// months — an undocumented, shifting boundary, not something worth building a second
// archive/forecast split around. Not fixable with a different parameter, just unavailable.

const AIR_QUALITY_HOURLY_FIELDS = [
  "pm2_5",
  "pm10",
  "ozone",
  "nitrogen_dioxide",
  "alder_pollen",
  "birch_pollen",
  "grass_pollen",
  "mugwort_pollen",
  "ragweed_pollen",
];

const POLLEN_FIELDS = ["alder_pollen", "birch_pollen", "grass_pollen", "mugwort_pollen", "ragweed_pollen"];

// WMO weather codes 95/96/99 are thunderstorm (plain, with slight hail, with heavy hail).
const THUNDERSTORM_CODES = new Set([95, 96, 99]);

function toDate(iso) {
  return new Date(`${iso}T00:00:00Z`);
}

function toISO(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(iso, n) {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}

// "YYYY-MM-DD" strings sort lexicographically the same as chronologically, so date-range
// comparisons elsewhere in this file just use plain string operators (<=, >) on them.
function daysBetween(fromIso, toIso) {
  return Math.round((toDate(toIso) - toDate(fromIso)) / 86400000);
}

async function getJSON(host, params) {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${host}?${qs.toString()}`);
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed (${res.status} ${res.statusText}): ${host}`);
  }
  return res.json();
}

// Pulls the requested fields out of a { daily: { time: [...], field: [...] } } response
// into a date -> row map, restricted to [filterStart, filterEnd] — the forecast endpoint in
// particular returns a wider window than asked for (whole past_days/forecast_days spans),
// so callers filter down to only the dates they actually requested.
function dailyResponseToMap(data, filterStart, filterEnd, fields) {
  const map = new Map();
  const times = data.daily?.time || [];
  for (let i = 0; i < times.length; i++) {
    const date = times[i];
    if (date < filterStart || date > filterEnd) continue;
    const row = { date };
    for (const field of fields) {
      row[field] = data.daily[field]?.[i] ?? null;
    }
    map.set(date, row);
  }
  return map;
}

// Splits [startDate, endDate] across the archive and forecast endpoints, since the caller's
// range can straddle the archive lag boundary and each endpoint only covers one side of it.
async function fetchWeatherDaily(lat, lon, startDate, endDate) {
  const todayIso = toISO(new Date());
  const cutoff = addDays(todayIso, -ARCHIVE_LAG_DAYS);

  const calls = [];

  if (startDate <= cutoff) {
    const archiveEnd = endDate < cutoff ? endDate : cutoff;
    calls.push(
      getJSON(ARCHIVE_HOST, {
        latitude: lat,
        longitude: lon,
        start_date: startDate,
        end_date: archiveEnd,
        daily: WEATHER_DAILY_FIELDS.join(","),
        timezone: "UTC",
      }).then((data) => dailyResponseToMap(data, startDate, archiveEnd, WEATHER_DAILY_FIELDS))
    );
  }

  if (endDate > cutoff) {
    const forecastStart = startDate > cutoff ? startDate : addDays(cutoff, 1);
    // past_days/forecast_days are counted relative to the API's own idea of "today" in
    // whatever timezone we ask it to use. We request UTC (see todayIso above) specifically
    // so that "today" can't silently shift a day ahead of our own date math for locations
    // east of UTC — with timezone=auto that mismatch produced an off-by-one gap here.
    const pastDays = Math.min(92, Math.max(0, daysBetween(forecastStart, todayIso)));
    const forecastDays = Math.max(1, daysBetween(todayIso, endDate) + 1);
    calls.push(
      getJSON(FORECAST_HOST, {
        latitude: lat,
        longitude: lon,
        daily: WEATHER_DAILY_FIELDS.join(","),
        timezone: "UTC",
        past_days: pastDays,
        forecast_days: forecastDays,
      }).then((data) => dailyResponseToMap(data, forecastStart, endDate, WEATHER_DAILY_FIELDS))
    );
  }

  const maps = await Promise.all(calls);
  const byDate = new Map();
  for (const map of maps) {
    for (const [date, row] of map) byDate.set(date, row);
  }
  return byDate;
}

// Air quality has no separate archive/forecast split — one host serves the full range,
// including today — so this just aggregates its hourly values down to daily means.
async function fetchAirQualityDaily(lat, lon, startDate, endDate) {
  const data = await getJSON(AIR_QUALITY_HOST, {
    latitude: lat,
    longitude: lon,
    start_date: startDate,
    end_date: endDate,
    hourly: AIR_QUALITY_HOURLY_FIELDS.join(","),
    timezone: "UTC",
  });

  const times = data.hourly?.time || [];
  const buckets = new Map(); // date -> { field: [values seen that day] }

  for (let i = 0; i < times.length; i++) {
    const date = times[i].slice(0, 10);
    if (!buckets.has(date)) buckets.set(date, {});
    const bucket = buckets.get(date);
    for (const field of AIR_QUALITY_HOURLY_FIELDS) {
      const value = data.hourly[field]?.[i];
      if (value === null || value === undefined) continue; // don't let nulls drag the mean down
      (bucket[field] || (bucket[field] = [])).push(value);
    }
  }

  const byDate = new Map();
  let sawAnyPollenValue = false;
  for (const [date, bucket] of buckets) {
    const row = { date };
    for (const field of AIR_QUALITY_HOURLY_FIELDS) {
      const values = bucket[field];
      // Outside pollen model coverage, every hour comes back null, so `values` is always
      // undefined here and this falls through to null — never to a 0-length-array-average
      // of 0. That matters downstream: lib/correlate.js relies on null (not 0) to treat an
      // uncovered field as "no data" rather than as a flat series it could compute r against.
      row[field] = values && values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
      if (POLLEN_FIELDS.includes(field) && row[field] !== null) sawAnyPollenValue = true;
    }
    byDate.set(date, row);
  }

  // Pollen coverage in Open-Meteo's air quality model is Europe-only, so a US (or otherwise
  // uncovered) location will legitimately come back null on every pollen field, every day.
  // That's expected, not a bug — but it's worth a heads-up so the pollen tiles can be hidden
  // for that user instead of silently showing blanks.
  if (byDate.size > 0 && !sawAnyPollenValue) {
    console.warn(
      `[openmeteo] All pollen fields came back null for lat=${lat}, lon=${lon} between ${startDate} and ${endDate} — likely outside pollen model coverage, consider dropping pollen tiles for this user.`
    );
  }

  return byDate;
}

// Fetches and merges daily weather + air quality data for [startDate, endDate] (inclusive,
// "YYYY-MM-DD" strings) into one array of daily objects, one per calendar day.
async function fetchEnvData(lat, lon, startDate, endDate) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("fetchEnvData requires numeric lat/lon");
  }
  if (startDate > endDate) {
    throw new Error("startDate must not be after endDate");
  }

  // Fetch one extra day before the requested range purely so pressure_change has a "prior
  // day" to diff against on the very first day the caller asked for — otherwise that day
  // would always show pressure_change: null just because its neighbor was out of window.
  const extendedStart = addDays(startDate, -1);

  const [weatherByDate, airByDate] = await Promise.all([
    fetchWeatherDaily(lat, lon, extendedStart, endDate),
    fetchAirQualityDaily(lat, lon, startDate, endDate),
  ]);

  const dates = [];
  for (let d = extendedStart; d <= endDate; d = addDays(d, 1)) {
    dates.push(d);
  }

  const merged = dates.map((date) => {
    const weather = weatherByDate.get(date) || {};
    const air = airByDate.get(date) || {};
    const weatherCode = weather.weather_code ?? null;

    return {
      date,
      temperature_2m_max: weather.temperature_2m_max ?? null,
      temperature_2m_min: weather.temperature_2m_min ?? null,
      temperature_2m_mean: weather.temperature_2m_mean ?? null,
      relative_humidity_2m_mean: weather.relative_humidity_2m_mean ?? null,
      surface_pressure_mean: weather.surface_pressure_mean ?? null,
      precipitation_sum: weather.precipitation_sum ?? null,
      rain_sum: weather.rain_sum ?? null,
      wind_speed_10m_max: weather.wind_speed_10m_max ?? null,
      wind_gusts_10m_max: weather.wind_gusts_10m_max ?? null,
      weather_code: weatherCode,
      pm2_5: air.pm2_5 ?? null,
      pm10: air.pm10 ?? null,
      ozone: air.ozone ?? null,
      nitrogen_dioxide: air.nitrogen_dioxide ?? null,
      alder_pollen: air.alder_pollen ?? null,
      birch_pollen: air.birch_pollen ?? null,
      grass_pollen: air.grass_pollen ?? null,
      mugwort_pollen: air.mugwort_pollen ?? null,
      ragweed_pollen: air.ragweed_pollen ?? null,
      thunderstorm: weatherCode !== null && THUNDERSTORM_CODES.has(weatherCode),
      pressure_change: null, // filled in below, once every day's row exists to diff against
    };
  });

  for (let i = 1; i < merged.length; i++) {
    const prev = merged[i - 1];
    const pressure = merged[i].surface_pressure_mean;
    // A same-day pressure drop is a well-documented migraine/joint-pain trigger — the whole
    // reason this field exists — but the delta only means something between two consecutive
    // calendar days, so either side being missing (a gap in the source data) means we skip it
    // rather than diff against a day that isn't actually "yesterday".
    merged[i].pressure_change =
      pressure !== null && prev.surface_pressure_mean !== null
        ? Number((pressure - prev.surface_pressure_mean).toFixed(2))
        : null;
  }

  // Drop the leading lookback day now that it's done its job of seeding pressure_change.
  return merged.slice(1);
}

module.exports = { fetchEnvData };
