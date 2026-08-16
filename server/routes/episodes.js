const express = require("express");
const Episode = require("../models/Episode");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");
const { evaluateSafety } = require("../lib/safety");
const { enrichEpisode } = require("../lib/enrichEpisode");

const router = express.Router();
router.use(requireAuth);

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // ~5MB base64 data URL — generous for a prototype-scale inline photo

router.post("/", async (req, res) => {
  try {
    const { date, symptoms, location, notes, photoDataUrl } = req.body;

    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ error: "At least one symptom is required" });
    }
    if (photoDataUrl && photoDataUrl.length > MAX_PHOTO_BYTES) {
      return res.status(400).json({ error: "Photo is too large" });
    }

    const user = await User.findById(req.userId);
    const activeById = new Map((user.trackedSymptoms || []).filter((s) => s.active).map((s) => [s.id, s]));

    const resolvedSymptoms = [];
    for (const entry of symptoms) {
      const tracked = activeById.get(entry.symptomId);
      if (!tracked) {
        return res.status(400).json({ error: `Unknown or inactive symptom: ${entry.symptomId}` });
      }
      const severity = Number(entry.severity);
      if (!Number.isInteger(severity) || severity < 1 || severity > 5) {
        return res.status(400).json({ error: "severity must be an integer from 1 to 5" });
      }
      resolvedSymptoms.push({ symptomId: tracked.id, name: tracked.name, category: tracked.category, severity });
    }

    const safety = evaluateSafety(resolvedSymptoms);

    // The episode is fully saved before anything environmental is even attempted — this is
    // the "never block or fail the save" guarantee from item 3, structurally, not just by
    // convention: environmentalContext starts as "pending" and nothing below this point can
    // undo the create() that already happened.
    const episode = await Episode.create({
      userId: req.userId,
      date: date ? new Date(date) : new Date(),
      symptoms: resolvedSymptoms,
      location: location || "unknown",
      notes,
      photoDataUrl,
      environmentalContext: { status: "pending" },
      safety,
      isDemo: !!user.isDemo,
    });

    // Fire-and-forget — deliberately not awaited. Enrichment runs after this response is
    // already on the wire; see lib/enrichEpisode.js for why it can never surface as a failure
    // here even if Open-Meteo is down.
    enrichEpisode(episode._id).catch((err) => console.error("[episodes] enrichment kickoff failed:", err.message));

    res.status(201).json(episode);
  } catch (err) {
    res.status(400).json({ error: "Could not save episode" });
  }
});

router.get("/", async (req, res) => {
  try {
    const episodes = await Episode.find({ userId: req.userId }).sort({ date: -1 });
    res.json(episodes);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch episodes" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const episode = await Episode.findOne({ _id: req.params.id, userId: req.userId });
    if (!episode) return res.status(404).json({ error: "Episode not found" });
    res.json(episode);
  } catch (err) {
    res.status(400).json({ error: "Could not fetch episode" });
  }
});

module.exports = router;
