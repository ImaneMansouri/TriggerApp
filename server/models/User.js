const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    // Never store plaintext passwords — this holds a bcrypt hash, set in routes/auth.js
    password: { type: String, required: true },
    // Location lets us correlate symptoms with local conditions (weather, pollen, etc.)
    lat: Number,
    lon: Number,
    conditions: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
