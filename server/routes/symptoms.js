const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");
const { SYMPTOM_CATEGORY_IDS, SYMPTOM_CATEGORIES } = require("../lib/categories");

const router = express.Router();
router.use(requireAuth);

router.get("/categories", (req, res) => {
  res.json({ categories: SYMPTOM_CATEGORIES });
});

router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ symptoms: user.trackedSymptoms || [] });
  } catch (err) {
    res.status(500).json({ error: "Could not load tracked symptoms" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!SYMPTOM_CATEGORY_IDS.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${SYMPTOM_CATEGORY_IDS.join(", ")}` });
    }

    const symptom = { id: crypto.randomUUID(), name: name.trim(), category, active: true };
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $push: { trackedSymptoms: symptom } },
      { new: true }
    );
    res.status(201).json({ symptoms: user.trackedSymptoms });
  } catch (err) {
    res.status(400).json({ error: "Could not add symptom" });
  }
});

// Rename, recategorize, or reactivate/deactivate a tracked symptom. Deactivating (active:
// false) is the only form of "removal" — see the schema comment in models/User.js for why an
// entry here is never actually deleted.
router.patch("/:id", async (req, res) => {
  try {
    const { name, category, active } = req.body;
    if (category !== undefined && !SYMPTOM_CATEGORY_IDS.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${SYMPTOM_CATEGORY_IDS.join(", ")}` });
    }

    const user = await User.findOne({ _id: req.userId, "trackedSymptoms.id": req.params.id });
    if (!user) return res.status(404).json({ error: "Symptom not found" });

    const symptom = user.trackedSymptoms.find((s) => s.id === req.params.id);
    if (name !== undefined) symptom.name = name.trim();
    if (category !== undefined) symptom.category = category;
    if (active !== undefined) symptom.active = !!active;
    await user.save();

    res.json({ symptoms: user.trackedSymptoms });
  } catch (err) {
    res.status(400).json({ error: "Could not update symptom" });
  }
});

// Soft delete — see the .patch comment above. Equivalent to PATCH { active: false }, offered
// as DELETE too since "remove a symptom" is how the product spec and UI describe this action.
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.userId, "trackedSymptoms.id": req.params.id },
      { $set: { "trackedSymptoms.$.active": false } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "Symptom not found" });
    res.json({ symptoms: user.trackedSymptoms });
  } catch (err) {
    res.status(400).json({ error: "Could not remove symptom" });
  }
});

module.exports = router;
