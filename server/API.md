# TriggerApp API

Base URL (local dev): `http://localhost:5050`

## Auth

All endpoints except `POST /api/auth/signup`, `POST /api/auth/login`, and `GET /api/health` require a JWT.

Send it as:

```
Authorization: Bearer <token>
```

The token is returned from signup/login and expires after 7 days. Requests without a valid token get `401 { "error": "..." }`.

---

## Health

### `GET /api/health`

**Auth:** none

**Response** `200`

```json
{ "status": "ok" }
```

---

## Auth

### `POST /api/auth/signup`

**Auth:** none

**Body**

```json
{
  "email": "string, required",
  "password": "string, required",
  "lat": "number, optional",
  "lon": "number, optional"
}
```

`lat`/`lon` are the user's saved location, used later by the environmental endpoints below. They can be omitted at signup and set later (there's currently no dedicated "update profile" route — that's not part of this API yet).

**Response** `201`

```json
{
  "token": "string",
  "user": {
    "_id": "string",
    "email": "string",
    "lat": "number | undefined",
    "lon": "number | undefined",
    "conditions": ["string"],
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
}
```

**Errors**
- `400` — missing email or password
- `409` — email already registered

---

### `POST /api/auth/login`

**Auth:** none

**Body**

```json
{ "email": "string, required", "password": "string, required" }
```

**Response** `200` — same shape as signup's response.

**Errors**
- `401` — email not found or password incorrect (same generic message either way, by design)

---

## Entries

### `POST /api/entries`

**Auth:** required

**Body**

```json
{
  "date": "ISO date string, required",
  "symptom": "string, required",
  "severity": "number 1-10, required",
  "notes": "string, optional",
  "location": "\"indoor\" | \"outdoor\" | \"unknown\", optional — defaults to \"unknown\""
}
```

**Response** `201` — the created entry document.

**Errors**
- `400` — validation failed (e.g. missing symptom, severity out of range)

---

### `GET /api/entries`

**Auth:** required

Returns all entries for the logged-in user, newest first.

**Response** `200`

```json
[
  {
    "_id": "string",
    "userId": "string",
    "date": "ISO date string",
    "symptom": "string",
    "severity": 1,
    "notes": "string",
    "location": "indoor | outdoor | unknown",
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
]
```

---

## Environmental data

Environmental data comes from Open-Meteo (weather + air quality/pollen), keyed per user per calendar day (`YYYY-MM-DD`) in an internal `EnvDaily` collection. It has to be populated by calling backfill before `today`/`patterns`/`export` will return anything meaningful.

**Data limitations:**
- **Pollen** (`alder`, `birch`, `grass`, `mugwort`, `ragweed`) only has model coverage in Europe. For a US (or otherwise uncovered) location, every pollen field comes back `null` on every day — always `null`, never `0` — which is expected, not an error. The frontend should hide the pollen tile when `dataAvailable.pollen` is all `false` for a user (see `GET /api/today` below); `GET /api/patterns` already drops pollen fields on its own, since a field with zero non-null observations can't clear the 10-observation minimum.
- **UV index** is not available at all and was dropped from the schema entirely. Open-Meteo's historical archive endpoint never computes it (it comes back `null` on every date, even when other fields are populated), and the forecast endpoint only carries real UV for roughly the last two months — an undocumented, shifting window not reliable enough to build a feature on.

### `POST /api/env/backfill`

Fetches environmental history for the logged-in user's saved location and stores it. Safe to call repeatedly — it upserts per day, so re-running it (e.g. after adding more days, or periodically to refresh) never creates duplicates.

**Auth:** required

**Body**

```json
{ "days": "number, optional — defaults to 90" }
```

`days` is the number of days of history to fetch, ending today.

**Response** `200`

```json
{
  "message": "Backfill complete",
  "days": 90,
  "rowsWritten": 90
}
```

**Errors**
- `400` — the user has no saved `lat`/`lon` (nothing to fetch weather for)
- `500` — the Open-Meteo request(s) failed

---

### `GET /api/today`

Returns today's environmental data for the logged-in user, shaped into the five groups the dashboard tiles map to: temperature, humidity, pressure, air quality, pollen.

**Auth:** required

**Response** `200`

```json
{
  "date": "2026-08-15",
  "temperature": { "max": 29.3, "min": 22.6, "mean": 24.6 },
  "humidity": { "mean": 93 },
  "pressure": { "mean": 996.2, "change": 1.4 },
  "airQuality": { "pm2_5": 2.78, "pm10": 3.09, "ozone": 60.04, "nitrogenDioxide": 6.58 },
  "pollen": { "alder": null, "birch": null, "grass": null, "mugwort": null, "ragweed": null },
  "dataAvailable": {
    "temperature": { "max": true, "min": true, "mean": true },
    "humidity": { "mean": true },
    "pressure": { "mean": true, "change": true },
    "airQuality": { "pm2_5": true, "pm10": true, "ozone": true, "nitrogenDioxide": true },
    "pollen": { "alder": false, "birch": false, "grass": false, "mugwort": false, "ragweed": false }
  }
}
```

All leaf values are `number | null`. `pressure.change` is today's mean surface pressure minus yesterday's (hPa) — a sharp negative value is a common migraine/joint-pain trigger. Units otherwise: temperature °C, humidity %, pressure hPa, PM2.5/PM10/ozone/NO₂ µg/m³, pollen grains/m³.

`dataAvailable` mirrors the shape above field-for-field, `true` when that value is non-null and `false` when it's `null`. It exists so the frontend can distinguish "no data for this location" from a genuine `0` (e.g. zero pollen count on a real in-season day in Europe) without special-casing — check the flag, don't check for `null` yourself. In practice this only ever goes fully `false` across a whole tile for `pollen`, for users outside Europe (see the data limitations note above), but it's computed per leaf field rather than per tile so a future gap in a single field (not just a whole group) is representable too.

**Errors**
- `404` — no `EnvDaily` row exists for today yet (backfill hasn't been run, or the user has no location)

---

### `GET /api/patterns`

Returns Pearson correlation coefficients between reported symptom severity and each environmental field, computed across all of the user's entries that have a matching environmental day. Sorted by absolute strength, strongest first. Fields with fewer than 10 paired (non-null) observations are omitted entirely, since a correlation from a handful of days isn't meaningful.

**Auth:** required

**Response** `200`

```json
{
  "correlations": [
    { "field": "pressure_change", "r": -0.4552, "n": 60 },
    { "field": "pm2_5", "r": 0.3442, "n": 60 },
    { "field": "nitrogen_dioxide", "r": 0.3191, "n": 60 }
  ]
}
```

Note pollen fields never appear here for a US-located user — they have zero non-null observations to correlate against, not just a weak correlation.

- `field` — the raw `EnvDaily` field name (see field list below).
- `r` — Pearson correlation coefficient, range `-1` to `1`. Positive means severity tends to rise with the field; negative means it tends to fall.
- `n` — number of paired observations (entries with a matching, non-null env value) the correlation was computed from.

`thunderstorm` (boolean in storage) is coded as `0`/`1` for this calculation.

---

### `GET /api/export`

Returns a CSV of every entry for the logged-in user, joined with that day's environmental data.

**Auth:** required

**Response** `200` — `Content-Type: text/csv`, `Content-Disposition: attachment; filename=triggerapp-export.csv`

Columns, in order:

```
date, symptom, severity, location, notes,
temperature_2m_max, temperature_2m_min, temperature_2m_mean,
relative_humidity_2m_mean, surface_pressure_mean,
precipitation_sum, rain_sum, wind_speed_10m_max, wind_gusts_10m_max,
weather_code,
pm2_5, pm10, ozone, nitrogen_dioxide,
alder_pollen, birch_pollen, grass_pollen, mugwort_pollen, ragweed_pollen,
thunderstorm, pressure_change
```

Rows are sorted by date ascending. If an entry's date has no matching environmental row, the environmental columns are left blank for that row.

---

## `EnvDaily` field reference

Used verbatim as the `field` values in `/api/patterns` and the column names in `/api/export`.

| Field | Meaning | Unit |
|---|---|---|
| `temperature_2m_max` / `_min` / `_mean` | Daily air temperature | °C |
| `relative_humidity_2m_mean` | Daily mean relative humidity | % |
| `surface_pressure_mean` | Daily mean surface pressure | hPa |
| `precipitation_sum` / `rain_sum` | Daily total precipitation / rain | mm |
| `wind_speed_10m_max` / `wind_gusts_10m_max` | Daily peak wind speed / gust | km/h |
| `weather_code` | WMO weather code for the day | code |
| `pm2_5` / `pm10` | Daily mean particulate matter | µg/m³ |
| `ozone` / `nitrogen_dioxide` | Daily mean air quality gases | µg/m³ |
| `alder_pollen` / `birch_pollen` / `grass_pollen` / `mugwort_pollen` / `ragweed_pollen` | Daily mean pollen concentration (Europe only, else `null`) | grains/m³ |
| `thunderstorm` | Derived: `true` if `weather_code` is 95, 96, or 99 | boolean |
| `pressure_change` | Derived: today's `surface_pressure_mean` minus yesterday's | hPa |

---

## Seed / demo data

`npm run seed` creates a demo account for local development and frontend work:

- **Email:** `demo@triggerapp.com`
- **Password:** `demo123`
- **Location:** Davenport, Iowa (41.52, -90.58) — a real US location, which means pollen is genuinely `null` for this account (see the data limitations note above). That's intentional: it's what most real users of this app will see.
- 60 days of symptom entries with varied severity and `location` values, plus a real environmental backfill. Entries are deliberately weighted toward fields that do have real US coverage — `pressure_change` (sharp drops), `pm2_5`, `ozone`, `nitrogen_dioxide` (all elevated-pollution days), `relative_humidity_2m_mean`, and daily temperature swing (max − min) — so `/api/patterns` has real signal to show without relying on pollen. Re-running the script is safe; it deletes and recreates the demo account each time.
