require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Entry = require("../models/Entry");
const EnvDaily = require("../models/EnvDaily");
const { backfillUser } = require("../lib/backfill");
const { computeCorrelations } = require("../lib/correlate");

const DEMO_EMAIL = "demo@triggerapp.com";
const DEMO_PASSWORD = "demo123";
const SEED_DAYS = 60;

// Davenport, Iowa — a real US user location. Pollen coverage (alder/birch/grass/mugwort/
// ragweed) only exists for Europe in Open-Meteo's air quality model (see lib/openmeteo.js),
// so every pollen field will come back null here, every day. That's expected, not a bug —
// GET /api/today's dataAvailable flags will mark the whole pollen tile unavailable, and
// GET /api/patterns will drop those fields entirely (fewer than 10 non-null observations).
// The synthetic severity model below is weighted toward fields that *do* have real coverage
// here instead: pm2_5, ozone, nitrogen_dioxide, pressure_change, relative_humidity_2m_mean,
// and daily temperature swing.
const DEMO_LAT = 41.52;
const DEMO_LON = -90.58;

const SYMPTOMS = ["headache", "migraine", "fatigue", "joint pain", "sinus pressure", "nausea"];
const LOCATIONS = ["indoor", "outdoor", "unknown"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// "High" for a field is defined relative to this dataset's own spread — raw µg/m³ or hPa
// values mean nothing on their own without knowing the range they actually came back in for
// this location and season. The 60th percentile marks the top ~40% of days as "high".
function highThreshold(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.6)];
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // Idempotent: wipe any previous run of this exact demo account before recreating it, so
  // re-running `npm run seed` never leaves duplicate entries or stale env rows behind.
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    await Promise.all([
      Entry.deleteMany({ userId: existing._id }),
      EnvDaily.deleteMany({ userId: existing._id }),
      User.deleteOne({ _id: existing._id }),
    ]);
    console.log("Removed existing demo user and data");
  }

  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await User.create({
    email: DEMO_EMAIL,
    password: hashed,
    lat: DEMO_LAT,
    lon: DEMO_LON,
    conditions: ["migraine", "seasonal allergies"],
  });
  console.log(`Created demo user ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  // Backfill first so entries below can be generated against *real* pollen and pressure
  // values — "make some entries correlate with pollen and pressure" means reading what the
  // API actually returned for these 60 days and boosting severity around it, not fabricating
  // env numbers to match invented entries.
  const rowsWritten = await backfillUser(user._id, SEED_DAYS);
  console.log(`Backfilled ${rowsWritten} days of environmental data`);

  const envRows = await EnvDaily.find({ userId: user._id }).sort({ date: 1 });

  const collect = (field) => envRows.map((r) => r[field]).filter((v) => v !== null);
  const swings = envRows
    .map((r) => (r.temperature_2m_max !== null && r.temperature_2m_min !== null ? r.temperature_2m_max - r.temperature_2m_min : null))
    .filter((v) => v !== null);

  const pm25High = highThreshold(collect("pm2_5"));
  const ozoneHigh = highThreshold(collect("ozone"));
  const no2High = highThreshold(collect("nitrogen_dioxide"));
  const humidityHigh = highThreshold(collect("relative_humidity_2m_mean"));
  const swingHigh = highThreshold(swings);
  const pressureDrops = collect("pressure_change");
  const pressureDropThreshold = pressureDrops.length ? Math.min(...pressureDrops) * 0.5 : null;

  const entries = envRows.map((env) => {
    let severity = 2 + Math.floor(Math.random() * 3); // baseline 2-4

    // Deliberate signal, weighted toward fields with real coverage at this US location
    // (pollen has none here — see DEMO_LAT/DEMO_LON above — so it's intentionally left out),
    // so GET /api/patterns has real correlations to surface instead of pure noise.
    if (pressureDropThreshold !== null && env.pressure_change !== null && env.pressure_change <= pressureDropThreshold) {
      severity += 3; // sharp pressure drop — classic migraine/joint-pain trigger
    }
    if (pm25High !== null && env.pm2_5 !== null && env.pm2_5 >= pm25High) {
      severity += 2;
    }
    if (ozoneHigh !== null && env.ozone !== null && env.ozone >= ozoneHigh) {
      severity += 2;
    }
    if (no2High !== null && env.nitrogen_dioxide !== null && env.nitrogen_dioxide >= no2High) {
      severity += 1;
    }
    if (humidityHigh !== null && env.relative_humidity_2m_mean !== null && env.relative_humidity_2m_mean >= humidityHigh) {
      severity += 1;
    }
    const swing = env.temperature_2m_max !== null && env.temperature_2m_min !== null ? env.temperature_2m_max - env.temperature_2m_min : null;
    if (swingHigh !== null && swing !== null && swing >= swingHigh) {
      severity += 1;
    }
    if (Math.random() < 0.3) severity -= 1; // a little noise so it isn't a clean step function

    return {
      userId: user._id,
      date: new Date(`${env.date}T09:00:00Z`),
      symptom: pick(SYMPTOMS),
      severity: clamp(Math.round(severity), 1, 10),
      location: pick(LOCATIONS),
    };
  });

  await Entry.insertMany(entries);
  console.log(`Created ${entries.length} symptom entries`);

  const correlations = await computeCorrelations(user._id);
  console.log("Top correlations from seeded data:");
  for (const c of correlations.slice(0, 5)) {
    console.log(`  ${c.field}: r=${c.r} (n=${c.n})`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
