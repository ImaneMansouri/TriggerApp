const mongoose = require("mongoose");

// A symptom as logged on this specific episode. {symptomId, name, category} are a SNAPSHOT
// of the user's tracked symptom at the moment of logging — not a live reference — precisely
// so that later renaming, recategorizing, or deactivating a tracked symptom (see models/User.js)
// can never change or break how a past episode reads.
const episodeSymptomSchema = new mongoose.Schema(
  {
    symptomId: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    severity: { type: Number, min: 1, max: 5, required: true },
  },
  { _id: false }
);

// The subset of an EnvDaily row relevant to an episode, copied over once enrichment runs
// (see lib/enrichEpisode.js) — kept as a snapshot rather than a join so a detail view never
// has to re-fetch or risk showing a different day's numbers than what was true at save time.
const environmentalContextSchema = new mongoose.Schema(
  {
    // pending: not enriched yet (just saved). complete: every relevant field had a value.
    // partial: some fields were null. unavailable: no location, or nothing could be fetched.
    // Enrichment can only move a episode INTO one of these states — it can never fail the
    // episode itself. See lib/enrichEpisode.js.
    status: { type: String, enum: ["pending", "complete", "partial", "unavailable"], default: "pending" },
    data: {
      temperature_2m_mean: { type: Number, default: null },
      relative_humidity_2m_mean: { type: Number, default: null },
      surface_pressure_mean: { type: Number, default: null },
      pressure_change: { type: Number, default: null },
      pm2_5: { type: Number, default: null },
      pm10: { type: Number, default: null },
      ozone: { type: Number, default: null },
      nitrogen_dioxide: { type: Number, default: null },
      alder_pollen: { type: Number, default: null },
      birch_pollen: { type: Number, default: null },
      grass_pollen: { type: Number, default: null },
      mugwort_pollen: { type: Number, default: null },
      ragweed_pollen: { type: Number, default: null },
      thunderstorm: { type: Boolean, default: null },
    },
    capturedAt: { type: Date, default: null },
  },
  { _id: false }
);

const episodeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    symptoms: {
      type: [episodeSymptomSchema],
      required: true,
      validate: { validator: (v) => Array.isArray(v) && v.length > 0, message: "At least one symptom is required" },
    },
    location: { type: String, enum: ["indoor", "outdoor", "both", "unknown"], default: "unknown" },
    notes: String,
    // Inline base64 data URL — a pragmatic prototype-scale choice, not a real file-storage
    // pipeline. Fine for a demo; swap for object storage (S3/Cloudinary/etc.) + a URL field
    // before this handles real photo volume.
    photoDataUrl: String,
    environmentalContext: { type: environmentalContextSchema, default: () => ({}) },
    safety: {
      flagged: { type: Boolean, default: false },
      reasons: [String],
    },
    // See models/User.js `isDemo` — keeps seeded demo episodes distinguishable from real ones.
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

episodeSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Episode", episodeSchema);
