/**
 * routes/deals.js — /api/deals
 *
 * GET    /              — list all deals (optionally filtered by stage)
 * POST   /              — create a deal
 * GET    /:id           — single deal
 * PUT    /:id           — update deal
 * PATCH  /:id/stage     — move deal to a different stage
 * DELETE /:id           — delete (admin only)
 * GET    /pipeline/summary — aggregated counts + values per stage
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const VALID_STAGES = ['prospect', 'qualified', 'negotiation', 'closed'];

// ── GET /api/deals/pipeline/summary ───────────────────────
router.get('/pipeline/summary', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT stage,
              COUNT(*)::int            AS count,
              COALESCE(SUM(value), 0)  AS total_value
       FROM deals
       GROUP BY stage
       ORDER BY ARRAY_POSITION($1::text[], stage)`,
      [VALID_STAGES]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get pipeline summary' });
  }
});

// ── GET /api/deals ─────────────────────────────────────────
router.get('/', async (req, res) => {
  const { stage, rep_id, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conditions = [];
  let idx = 1;

  if (stage)  { conditions.push(`d.stage = $${idx++}`);       params.push(stage); }
  if (rep_id) { conditions.push(`d.assigned_to = $${idx++}`); params.push(rep_id); }
  if (req.user.role === 'rep') {
    conditions.push(`d.assigned_to = $${idx++}`);
    params.push(req.user.id);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const dataRes = await pool.query(
      `SELECT d.*, u.name AS rep_name, u.avatar_color AS rep_color
       FROM deals d LEFT JOIN users u ON d.assigned_to = u.id
       ${where} ORDER BY d.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );
    res.json(dataRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// ── POST /api/deals ────────────────────────────────────────
router.post('/', [
  body('name').trim().notEmpty(),
  body('value').isFloat({ min: 0 }),
  body('stage').isIn(VALID_STAGES),
  body('probability').isInt({ min: 0, max: 100 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { name, company, value, stage, probability, close_date, assigned_to, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO deals (name, company, value, stage, probability, close_date, assigned_to, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, company, value, stage, probability, close_date, assigned_to || req.user.id, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

// ── GET /api/deals/:id ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.name AS rep_name FROM deals d
       LEFT JOIN users u ON d.assigned_to = u.id WHERE d.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

// ── PUT /api/deals/:id ─────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { name, company, value, stage, probability, close_date, assigned_to, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE deals SET name=$1, company=$2, value=$3, stage=$4, probability=$5,
       close_date=$6, assigned_to=$7, notes=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [name, company, value, stage, probability, close_date, assigned_to, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

// ── PATCH /api/deals/:id/stage ─────────────────────────────
router.patch('/:id/stage', [
  body('stage').isIn(VALID_STAGES),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  // Auto-set probability based on stage
  const probMap = { prospect: 20, qualified: 50, negotiation: 75, closed: 100 };
  const { stage } = req.body;
  try {
    const result = await pool.query(
      `UPDATE deals SET stage=$1, probability=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [stage, probMap[stage], req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stage' });
  }
});

// ── DELETE /api/deals/:id ──────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM deals WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete deal' });
  }
});

module.exports = router;
