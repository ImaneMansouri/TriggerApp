const express = require("express");
const Entry = require("../models/Entry");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// Applied to every route below with one line, instead of repeating requireAuth
// on each route — router-level middleware runs before any handler in this file.
router.use(requireAuth);

router.post("/", async (req, res) => {
  try {
    const { date, symptom, severity, notes } = req.body;
    // userId comes from the verified token (req.userId), never from the request body —
    // otherwise a client could create entries under someone else's account.
    const entry = await Entry.create({ userId: req.userId, date, symptom, severity, notes });
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: "Could not create entry" });
  }
});

router.get("/", async (req, res) => {
  try {
    const entries = await Entry.find({ userId: req.userId }).sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch entries" });
  }
});

module.exports = router;
