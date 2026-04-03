/**
 * middleware/auth.js
 *
 * authenticate  — verifies JWT, attaches req.user = { id, email, role }
 * requireAdmin  — gates a route to admin-role users only
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nexus_dev_secret';

// ── Verify bearer token ────────────────────────────────────
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;   // { id, email, role, name }
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ error: message });
  }
}

// ── Restrict to admins ─────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ── Restrict to admin OR the user themselves ───────────────
function requireSelfOrAdmin(req, res, next) {
  if (req.user?.role === 'admin' || req.user?.id === req.params.id) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden' });
}

module.exports = { authenticate, requireAdmin, requireSelfOrAdmin };
