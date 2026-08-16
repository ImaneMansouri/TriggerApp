const express = require("express");
const EnvDaily = require("../models/EnvDaily");
const Episode = require("../models/Episode");
const requireAuth = require("../middleware/auth");
const { backfillUser } = require("../lib/backfill");
const { ensureFreshData } = require("../lib/envIngest");
const { CONTEXT_FIELDS } = require("../lib/enrichEpisode");

const router = express.Router();

// This router is mounted at "/api" (not "/api/env" like the other routers) because the
// dashboard endpoints below are top-level (/api/today, /api/export) and only the backfill/
// sync triggers themselves live under /api/env — see server.js.
router.use(requireAuth);

const DEFAULT_BACKFILL_DAYS = 90;

router.post("/env/backfill", async (req, res) => {
  try {
    const days = Number(req.body?.days) || DEFAULT_BACKFILL_DAYS;
    const rowsWritten = await backfillUser(req.userId, days);
    res.json({ message: "Backfill complete", days, rowsWritten });
  } catch (err) {
    if (err.message.includes("saved location")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Backfill failed" });
  }
});

// Opportunistic refresh, meant to be called once when the app opens (see src/lib/envSync.js)
// rather than on a schedule — see lib/envIngest.js for the reusable service this wraps and
// where real scheduled-job support would plug in later.
router.post("/env/sync", async (req, res) => {
  try {
    const rowsWritten = await ensureFreshData(req.userId);
    res.json({ message: "Sync complete", rowsWritten });
  } catch (err) {
    if (err.message.includes("saved location")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Sync failed" });
  }
});

router.get("/today", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const row = await EnvDaily.findOne({ userId: req.userId, date: today });
    if (!row) {
      return res
        .status(404)
        .json({ error: "No environmental data for today yet. Run POST /api/env/backfill first." });
    }

    // Shaped into groups, one per dashboard tile, rather than the raw flat row.
    const tiles = {
      temperature: {
        max: row.temperature_2m_max,
        min: row.temperature_2m_min,
        mean: row.temperature_2m_mean,
      },
      humidity: {
        mean: row.relative_humidity_2m_mean,
      },
      pressure: {
        mean: row.surface_pressure_mean,
        change: row.pressure_change,
      },
      airQuality: {
        pm2_5: row.pm2_5,
        pm10: row.pm10,
        ozone: row.ozone,
        nitrogenDioxide: row.nitrogen_dioxide,
      },
      pollen: {
        alder: row.alder_pollen,
        birch: row.birch_pollen,
        grass: row.grass_pollen,
        mugwort: row.mugwort_pollen,
        ragweed: row.ragweed_pollen,
      },
    };

    // One boolean per leaf field, mirroring `tiles`' shape, so the frontend can hide a
    // whole tile (e.g. pollen for a US user, where every field is null — see
    // lib/openmeteo.js) or grey out a single stat without guessing at null vs. real 0.
    const dataAvailable = {};
    for (const [group, fields] of Object.entries(tiles)) {
      dataAvailable[group] = Object.fromEntries(
        Object.entries(fields).map(([field, value]) => [field, value !== null])
      );
    }

    res.json({ date: row.date, ...tiles, dataAvailable });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch today's environmental data" });
  }
});

router.get("/export", async (req, res) => {
  try {
    const episodes = await Episode.find({ userId: req.userId }).sort({ date: 1 });

    const header = [
      "date",
      "symptom",
      "category",
      "severity",
      "location",
      "notes",
      "environmental_status",
      ...CONTEXT_FIELDS,
    ];

    const csvEscape = (value) => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const lines = [header.map(csvEscape).join(",")];
    // One row per symptom-within-episode — a multi-symptom episode fans out to several rows
    // sharing the same date/location/environmental snapshot, which is far more useful to
    // import into a spreadsheet than one row with a comma-packed symptom list.
    for (const episode of episodes) {
      const date = episode.date.toISOString().slice(0, 10);
      const ctx = episode.environmentalContext?.data || {};
      for (const symptom of episode.symptoms) {
        const row = [
          date,
          symptom.name,
          symptom.category,
          symptom.severity,
          episode.location,
          episode.notes || "",
          episode.environmentalContext?.status || "unavailable",
          ...CONTEXT_FIELDS.map((field) => (ctx[field] === undefined ? "" : ctx[field])),
        ];
        lines.push(row.map(csvEscape).join(","));
      }
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=triggerapp-export.csv");
    res.send(lines.join("\n"));
  } catch (err) {
    res.status(500).json({ error: "Could not generate export" });
  }
});

module.exports = router;
