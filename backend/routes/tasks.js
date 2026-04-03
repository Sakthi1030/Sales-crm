/**
 * routes/tasks.js — /api/tasks
 *
 * GET    /           — list tasks (filter: done, priority, rep)
 * POST   /           — create a task
 * PUT    /:id        — update a task
 * PATCH  /:id/toggle — toggle done/pending
 * DELETE /:id        — delete a task
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ── GET /api/tasks ─────────────────────────────────────────
router.get('/', async (req, res) => {
  const { done, priority, rep_id } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;

  // Reps see only their own tasks
  const repFilter = req.user.role === 'rep' ? req.user.id : (rep_id || null);
  if (repFilter)           { conditions.push(`t.assigned_to = $${idx++}`); params.push(repFilter); }
  if (done !== undefined)  { conditions.push(`t.done = $${idx++}`);        params.push(done === 'true'); }
  if (priority)            { conditions.push(`t.priority = $${idx++}`);    params.push(priority); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT t.*, u.name AS rep_name, u.avatar_color AS rep_color
       FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
       ${where} ORDER BY t.due_date ASC, t.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// ── POST /api/tasks ────────────────────────────────────────
router.post('/', [
  body('title').trim().notEmpty(),
  body('due_date').optional().isISO8601(),
  body('priority').optional().isIn(['High', 'Medium', 'Low']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { title, due_date, priority = 'Medium', link_type, link_id, assigned_to, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, due_date, priority, link_type, link_id, assigned_to, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, due_date, priority, link_type, link_id, assigned_to || req.user.id, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// ── PUT /api/tasks/:id ─────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { title, due_date, priority, link_type, link_id, assigned_to, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tasks SET title=$1, due_date=$2, priority=$3, link_type=$4, link_id=$5,
       assigned_to=$6, notes=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [title, due_date, priority, link_type, link_id, assigned_to, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// ── PATCH /api/tasks/:id/toggle ────────────────────────────
router.patch('/:id/toggle', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE tasks SET done = NOT done, updated_at = NOW() WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle task' });
  }
});

// ── DELETE /api/tasks/:id ──────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
