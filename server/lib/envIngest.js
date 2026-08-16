const EnvDaily = require("../models/EnvDaily");
const { backfillUser } = require("./backfill");

const FULL_BACKFILL_DAYS = 90;
// Re-pull a couple of extra recent days on every refresh, not just the exact gap — Open-Meteo's
// archive endpoint backfills very recent dates from forecast-sourced estimates that settle into
// more accurate reanalysis values a few days later (see lib/openmeteo.js ARCHIVE_LAG_DAYS).
const REFRESH_BUFFER_DAYS = 3;

// The single entry point for "make sure this user's environmental baseline is reasonably
// current." This is the reusable ingestion service item 7 asks for — every caller (explicit
// backfill, opportunistic refresh on app open, episode-save enrichment) goes through this one
// function rather than each rolling its own Open-Meteo logic.
//
// There's no scheduled job runner in this deployment, so nothing here assumes one. A real
// cron / serverless scheduled function can call `ensureFreshData(userId)` for every user on a
// timer later without any change to this function — it's already the right shape for that,
// it's just not wired to a scheduler yet. Today it's triggered by POST /api/env/sync, which
// the frontend calls once when the app opens (see src/lib/envSync.js).
async function ensureFreshData(userId) {
  const latest = await EnvDaily.findOne({ userId }).sort({ date: -1 });
  if (!latest) {
    return backfillUser(userId, FULL_BACKFILL_DAYS);
  }

  const today = new Date().toISOString().slice(0, 10);
  const daysSince = Math.round((new Date(`${today}T00:00:00Z`) - new Date(`${latest.date}T00:00:00Z`)) / 86400000);
  if (daysSince <= 0) {
    return 0; // already fresh as of today
  }
  return backfillUser(userId, daysSince + REFRESH_BUFFER_DAYS);
}

module.exports = { ensureFreshData, FULL_BACKFILL_DAYS };
