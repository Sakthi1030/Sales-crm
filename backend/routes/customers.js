/**
 * routes/customers.js — /api/customers
 *
 * GET    /              — list customers (search, paginate)
 * POST   /              — create customer
 * GET    /:id           — single customer + interaction history
 * PUT    /:id           — update customer
 * DELETE /:id           — delete (admin only)
 * POST   /:id/interactions — log a new interaction
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ── GET /api/customers ─────────────────────────────────────
router.get('/', async (req, res) => {
  const { q, industry, page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (q) {
    conditions.push(`(c.name ILIKE $${idx} OR c.company ILIKE $${idx} OR c.email ILIKE $${idx})`);
    params.push(`%${q}%`); idx++;
  }
  if (industry) { conditions.push(`c.industry = $${idx++}`); params.push(industry); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM customers c ${where}`, params),
      pool.query(
        `SELECT c.*, u.name AS rep_name, u.avatar_color AS rep_color
         FROM customers c LEFT JOIN users u ON c.account_manager = u.id
         ${where} ORDER BY c.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    const total = parseInt(countRes.rows[0].count);
    res.json({
      data: dataRes.rows,
      meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// ── POST /api/customers ────────────────────────────────────
router.post('/', [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('company').trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { name, email, phone, company, industry = 'Technology',
          lifetime_value = 0, account_manager } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO customers (name, email, phone, company, industry, lifetime_value, account_manager)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, email, phone, company, industry, lifetime_value, account_manager || req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// ── GET /api/customers/:id ─────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [custRes, interRes] = await Promise.all([
      pool.query(
        `SELECT c.*, u.name AS rep_name, u.email AS rep_email, u.avatar_color AS rep_color
         FROM customers c LEFT JOIN users u ON c.account_manager = u.id
         WHERE c.id = $1`,
        [req.params.id]
      ),
      pool.query(
        `SELECT i.*, u.name AS rep_name FROM interactions i
         LEFT JOIN users u ON i.created_by = u.id
         WHERE i.customer_id = $1 ORDER BY i.created_at DESC`,
        [req.params.id]
      ),
    ]);
    if (custRes.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ ...custRes.rows[0], interactions: interRes.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// ── PUT /api/customers/:id ─────────────────────────────────
router.put('/:id', async (req, res) => {
  const { name, email, phone, company, industry, lifetime_value, account_manager } = req.body;
  try {
    const result = await pool.query(
      `UPDATE customers SET name=$1, email=$2, phone=$3, company=$4,
       industry=$5, lifetime_value=$6, account_manager=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [name, email, phone, company, industry, lifetime_value, account_manager, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// ── DELETE /api/customers/:id ──────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM customers WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// ── POST /api/customers/:id/interactions ───────────────────
router.post('/:id/interactions', [
  body('type').trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { type, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO interactions (customer_id, type, notes, created_by)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, type, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log interaction' });
  }
});

module.exports = router;
