const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema(
  {
    // ref: "User" lets us .populate("userId") later if we ever need the user's info on an entry
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    symptom: { type: String, required: true },
    severity: { type: Number, min: 1, max: 10, required: true },
    notes: String,
  },
  { timestamps: true }
);

// Compound index: every query we make is "this user's entries, ordered by date" —
// indexing both fields together makes that lookup fast as entries grow.
entrySchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Entry", entrySchema);
