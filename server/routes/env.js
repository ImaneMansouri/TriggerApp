const express = require("express");
const EnvDaily = require("../models/EnvDaily");
const Entry = require("../models/Entry");
const requireAuth = require("../middleware/auth");
const { backfillUser } = require("../lib/backfill");
const { computeCorrelations, ENV_FIELDS } = require("../lib/correlate");

const router = express.Router();

// This router is mounted at "/api" (not "/api/env" like the other routers) because the
// dashboard endpoints below are top-level (/api/today, /api/patterns, /api/export) and only
// the backfill trigger itself lives under /api/env — see server.js.
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

router.get("/today", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const row = await EnvDaily.findOne({ userId: req.userId, date: today });
    if (!row) {
      return res
        .status(404)
        .json({ error: "No environmental data for today yet — run POST /api/env/backfill first" });
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

router.get("/patterns", async (req, res) => {
  try {
    const correlations = await computeCorrelations(req.userId);
    res.json({ correlations });
  } catch (err) {
    res.status(500).json({ error: "Could not compute correlations" });
  }
});

router.get("/export", async (req, res) => {
  try {
    const [entries, envRows] = await Promise.all([
      Entry.find({ userId: req.userId }).sort({ date: 1 }),
      EnvDaily.find({ userId: req.userId }),
    ]);
    const envByDate = new Map(envRows.map((row) => [row.date, row]));

    const header = ["date", "symptom", "severity", "location", "notes", ...ENV_FIELDS];

    const csvEscape = (value) => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      // Quote (and escape inner quotes) only when the value actually needs it, so a plain
      // number or word doesn't get wrapped in quotes for no reason.
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const lines = [header.map(csvEscape).join(",")];
    for (const entry of entries) {
      const date = entry.date.toISOString().slice(0, 10);
      const env = envByDate.get(date);
      const row = [
        date,
        entry.symptom,
        entry.severity,
        entry.location,
        entry.notes || "",
        ...ENV_FIELDS.map((field) => (env ? env[field] : "")),
      ];
      lines.push(row.map(csvEscape).join(","));
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=triggerapp-export.csv");
    res.send(lines.join("\n"));
  } catch (err) {
    res.status(500).json({ error: "Could not generate export" });
  }
});

module.exports = router;
