const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// 7 days — a hackathon demo app, so we favor "user doesn't get logged out mid-demo"
// over tight session hygiene. A real product would use a shorter expiry + refresh tokens.
const TOKEN_EXPIRY = "7d";

function signToken(userId) {
  // The JWT payload is NOT encrypted, only signed — anyone can base64-decode and read it,
  // they just can't forge or alter it without knowing JWT_SECRET. So it must never contain
  // a password, hash, or anything else sensitive — just an opaque ID we can look up.
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

router.post("/signup", async (req, res) => {
  try {
    const { email, password, lat, lon } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      // 409 Conflict, not 400 — the request was well-formed, it just collides with existing state
      return res.status(409).json({ error: "Email already in use" });
    }

    // Hash BEFORE saving, never store the raw password: if the DB ever leaks, bcrypt hashes
    // are computationally expensive to crack, plaintext passwords are just... passwords.
    // 10 salt rounds is the standard bcrypt default — a good balance of security vs. speed.
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, lat, lon });

    const token = signToken(user._id);
    const { password: _omit, ...safeUser } = user.toObject();
    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // Same 401 + generic message whether the email doesn't exist or the password is wrong —
    // don't reveal which one failed, that tells attackers which emails are registered.
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user._id);
    const { password: _omit, ...safeUser } = user.toObject();
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
