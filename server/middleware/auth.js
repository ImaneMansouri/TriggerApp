const jwt = require("jsonwebtoken");

// Runs in front of any route that needs to know "who is making this request".
// It doesn't touch the database — it just checks the token's signature and expiry,
// which is what makes JWTs fast: no DB round-trip on every request.
module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization; // expected format: "Bearer <token>"
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // Throws if the signature doesn't match JWT_SECRET or the token is expired.
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId; // routes read req.userId instead of trusting a body/query param
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
