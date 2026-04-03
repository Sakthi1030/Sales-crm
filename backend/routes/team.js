/**
 * routes/team.js — /api/team
 *
 * GET    /       — list all team members (admin only)
 * GET    /:id    — single user
 * PUT    /:id    — update user (admin or self)
 * DELETE /:id    — remove user (admin only)
 */

const express = require('express');
const { pool } = require('../config/db');
const { authenticate, requireAdmin, requireSelfOrAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ── GET /api/team ──────────────────────────────────────────
router.get('/', requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, avatar_color, created_at, last_login FROM users ORDER BY role, name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// ── GET /api/team/:id ──────────────────────────────────────
router.get('/:id', requireSelfOrAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, avatar_color, created_at, last_login FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ── PUT /api/team/:id ──────────────────────────────────────
router.put('/:id', requireSelfOrAdmin, async (req, res) => {
  const { name, avatar_color } = req.body;
  // Only admins can change roles
  const role = req.user.role === 'admin' ? (req.body.role || undefined) : undefined;

  try {
    const sets    = ['name=$1', 'avatar_color=$2', 'updated_at=NOW()'];
    const params  = [name, avatar_color];
    if (role) { sets.push(`role=$${params.length + 1}`); params.push(role); }
    params.push(req.params.id);

    const result = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id=$${params.length} RETURNING id, name, email, role, avatar_color`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ── DELETE /api/team/:id ───────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "You can't delete yourself" });
  }
  try {
    const result = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
