const express = require("express");
const requireAuth = require("../middleware/auth");
const { computePatterns } = require("../lib/patternEngine");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const result = await computePatterns(req.userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Could not compute patterns" });
  }
});

module.exports = router;
