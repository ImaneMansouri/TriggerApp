const express = require("express");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Kept separate from routes/auth.js (which already has its own PATCH /api/auth/profile for
// lat/lon/conditions) so this file — covering the newer username/age/avatar/preferences
// fields — never has to touch auth.js, which is actively owned by teammate work on
// signup/login.
// "avatar" stores a companion id — mirrors src/lib/companions.js on the frontend (no shared
// code path between them, so kept in sync by hand). The rendered glyph (emoji today, an
// image once the hand-drawn heart lands) is purely a frontend concern; the backend only
// ever needs to validate and store the id.
const AVATAR_OPTIONS = ["heart", "cloud", "sprout", "sun"];

router.get("/avatars", (req, res) => {
  res.json({ avatars: AVATAR_OPTIONS });
});

router.patch("/", async (req, res) => {
  try {
    const { username, age, avatar, preferences } = req.body;
    const update = {};

    if (username !== undefined) {
      if (typeof username !== "string" || !username.trim()) {
        return res.status(400).json({ error: "username must be a non-empty string" });
      }
      update.username = username.trim();
    }
    if (age !== undefined) {
      if (age !== null && (typeof age !== "number" || age < 0 || age > 130)) {
        return res.status(400).json({ error: "age must be a realistic number" });
      }
      update.age = age;
    }
    if (avatar !== undefined) {
      if (!AVATAR_OPTIONS.includes(avatar)) {
        return res.status(400).json({ error: `avatar must be one of: ${AVATAR_OPTIONS.join(", ")}` });
      }
      update.avatar = avatar;
    }
    if (preferences !== undefined) {
      if (typeof preferences !== "object" || preferences === null || Array.isArray(preferences)) {
        return res.status(400).json({ error: "preferences must be an object" });
      }
      for (const [key, value] of Object.entries(preferences)) {
        if (!["hasEpinephrine", "acknowledgedDisclaimer"].includes(key) || typeof value !== "boolean") {
          return res.status(400).json({ error: "unsupported preferences field" });
        }
        update[`preferences.${key}`] = value;
      }
    }

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { password: _omit, ...safeUser } = user.toObject();
    res.json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: "Could not update profile" });
  }
});

module.exports = router;
