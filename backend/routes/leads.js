/**
 * routes/leads.js — /api/leads
 *
 * GET    /           — list leads (search, filter by status, paginate)
 * POST   /           — create a lead
 * GET    /:id        — get a single lead
 * PUT    /:id        — update a lead
 * DELETE /:id        — delete a lead
 * PATCH  /:id/status — quick-update status only
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All lead routes require authentication
router.use(authenticate);

// ── GET /api/leads ─────────────────────────────────────────
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['new', 'contacted', 'qualified', 'lost']),
  query('priority').optional().isIn(['high', 'medium', 'low']),
  query('q').optional().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const page     = parseInt(req.query.page  || '1');
  const limit    = parseInt(req.query.limit || '10');
  const offset   = (page - 1) * limit;
  const { status, priority, q, rep_id } = req.query;

  // Sales reps can only see their own leads
  const assignedFilter = req.user.role === 'rep' ? req.user.id : (rep_id || null);

  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (status)         { conditions.push(`l.status = $${idx++}`);       params.push(status); }
  if (priority)       { conditions.push(`l.priority = $${idx++}`);     params.push(priority); }
  if (assignedFilter) { conditions.push(`l.assigned_to = $${idx++}`);  params.push(assignedFilter); }
  if (q) {
    conditions.push(`(l.name ILIKE $${idx} OR l.company ILIKE $${idx} OR l.email ILIKE $${idx})`);
    params.push(`%${q}%`); idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countSql = `SELECT COUNT(*) FROM leads l ${where}`;
    const dataSql  = `
      SELECT
        l.*,
        u.name  AS rep_name,
        u.email AS rep_email,
        u.avatar_color AS rep_color
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      ${where}
      ORDER BY l.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const [countRes, dataRes] = await Promise.all([
      pool.query(countSql, params),
      pool.query(dataSql, [...params, limit, offset]),
    ]);

    const total = parseInt(countRes.rows[0].count);
    res.json({
      data: dataRes.rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('GET /leads error:', err);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// ── POST /api/leads ────────────────────────────────────────
router.post('/', [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('company').trim().notEmpty(),
  body('status').optional().isIn(['new', 'contacted', 'qualified', 'lost']),
  body('priority').optional().isIn(['high', 'medium', 'low']),
  body('value').optional().isFloat({ min: 0 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const {
    name, email, phone, company,
    status = 'new', priority = 'medium',
    source = 'Website', value = 0,
    assigned_to, notes,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO leads
         (name, email, phone, company, status, priority, source, value, assigned_to, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [name, email, phone, company, status, priority, source, value,
       assigned_to || req.user.id, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /leads error:', err);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// ── GET /api/leads/:id ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, u.name AS rep_name, u.email AS rep_email, u.avatar_color AS rep_color
       FROM leads l LEFT JOIN users u ON l.assigned_to = u.id
       WHERE l.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });

    // Reps can only view their own leads
    if (req.user.role === 'rep' && result.rows[0].assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// ── PUT /api/leads/:id ─────────────────────────────────────
router.put('/:id', async (req, res) => {
  const {
    name, email, phone, company,
    status, priority, source, value, assigned_to, notes,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE leads SET
         name=$1, email=$2, phone=$3, company=$4,
         status=$5, priority=$6, source=$7, value=$8,
         assigned_to=$9, notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [name, email, phone, company, status, priority, source, value,
       assigned_to, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// ── PATCH /api/leads/:id/status ────────────────────────────
router.patch('/:id/status', [
  body('status').isIn(['new', 'contacted', 'qualified', 'lost']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const result = await pool.query(
      `UPDATE leads SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [req.body.status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ── DELETE /api/leads/:id ──────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM leads WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

module.exports = router;
