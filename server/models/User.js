const mongoose = require("mongoose");
const { SYMPTOM_CATEGORY_IDS } = require("../lib/categories");

// A user-defined symptom they've chosen to track (e.g. "rash", "cough" — arbitrary names).
// `active: false` is a soft delete: routes/symptoms.js never actually removes an array entry,
// because Episode documents snapshot {symptomId, name, category} at logging time (see
// models/Episode.js) — deactivating a symptom must never affect historical episodes, and
// keeping the definition around (just hidden from the active tracking list) is what makes
// that snapshot's symptomId still mean something if it's ever looked up.
const trackedSymptomSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: SYMPTOM_CATEGORY_IDS },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    // Never store plaintext passwords — this holds a bcrypt hash, set in routes/auth.js
    password: { type: String, required: true },
    // Location lets us correlate symptoms with local conditions (weather, pollen, etc.)
    lat: Number,
    lon: Number,
    conditions: [String],

    username: { type: String, trim: true },
    age: Number,
    // One of a small fixed set of illustrated options offered at onboarding — see
    // src/Pages/Onboarding/OnboardingAvatar.jsx for the actual choices.
    avatar: { type: String },
    trackedSymptoms: [trackedSymptomSchema],
    preferences: {
      // Surfaced only in the safety alert screen, and only if true — see lib/safety.js.
      hasEpinephrine: { type: Boolean, default: false },
      acknowledgedDisclaimer: { type: Boolean, default: false },
    },
    // Flags demo/seeded accounts so real user data and demo data are never mixed in any
    // listing that matters (see scripts/seed.js and item 13 of the product spec).
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
