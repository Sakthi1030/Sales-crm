/**
 * routes/reports.js — /api/reports
 *
 * GET /overview        — top-level KPIs
 * GET /monthly-revenue — monthly revenue array
 * GET /lead-sources    — lead source breakdown
 * GET /rep-performance — per-rep stats
 * GET /win-rate        — monthly win rate trend
 * GET /conversion      — funnel: leads → contacted → qualified → closed
 */

const express = require('express');
const { pool } = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ── GET /api/reports/overview ──────────────────────────────
router.get('/overview', async (_req, res) => {
  try {
    const [revRes, leadsRes, dealsRes, custRes] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(value), 0) AS total FROM deals WHERE stage = 'closed'`),
      pool.query(`SELECT COUNT(*) AS total FROM leads`),
      pool.query(`SELECT COUNT(*) AS total FROM deals WHERE stage != 'closed'`),
      pool.query(`SELECT COUNT(*) AS total FROM customers`),
    ]);
    res.json({
      total_revenue:  parseFloat(revRes.rows[0].total),
      total_leads:    parseInt(leadsRes.rows[0].total),
      active_deals:   parseInt(dealsRes.rows[0].total),
      total_customers:parseInt(custRes.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load overview' });
  }
});

// ── GET /api/reports/monthly-revenue ──────────────────────
router.get('/monthly-revenue', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', close_date), 'Mon') AS month,
         EXTRACT(MONTH FROM close_date)::int             AS month_num,
         COALESCE(SUM(value), 0)                         AS revenue
       FROM deals
       WHERE stage = 'closed'
         AND close_date >= NOW() - INTERVAL '12 months'
       GROUP BY 1, 2
       ORDER BY 2`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch monthly revenue' });
  }
});

// ── GET /api/reports/lead-sources ─────────────────────────
router.get('/lead-sources', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT source, COUNT(*) AS count FROM leads GROUP BY source ORDER BY count DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lead sources' });
  }
});

// ── GET /api/reports/rep-performance ──────────────────────
router.get('/rep-performance', requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id, u.name, u.avatar_color AS color,
         COUNT(DISTINCT l.id)::int                                      AS leads_count,
         COUNT(DISTINCT d.id)::int                                      AS total_deals,
         COUNT(DISTINCT d.id) FILTER (WHERE d.stage = 'closed')::int   AS closed_deals,
         COALESCE(SUM(d.value) FILTER (WHERE d.stage = 'closed'), 0)   AS revenue,
         ROUND(
           100.0 * COUNT(d.id) FILTER (WHERE d.stage = 'closed')
                  / NULLIF(COUNT(d.id), 0)
         )::int AS win_rate
       FROM users u
       LEFT JOIN leads l    ON l.assigned_to = u.id
       LEFT JOIN deals d    ON d.assigned_to = u.id
       WHERE u.role = 'rep'
       GROUP BY u.id, u.name, u.avatar_color
       ORDER BY revenue DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rep performance' });
  }
});

// ── GET /api/reports/win-rate ──────────────────────────────
router.get('/win-rate', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
         EXTRACT(MONTH FROM created_at)::int              AS month_num,
         ROUND(
           100.0 * COUNT(*) FILTER (WHERE stage = 'closed') / NULLIF(COUNT(*), 0)
         )::int AS win_rate
       FROM deals
       WHERE created_at >= NOW() - INTERVAL '12 months'
       GROUP BY 1, 2
       ORDER BY 2`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch win rate' });
  }
});

// ── GET /api/reports/conversion ────────────────────────────
router.get('/conversion', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE TRUE)                AS total_leads,
         COUNT(*) FILTER (WHERE status='contacted')  AS contacted,
         COUNT(*) FILTER (WHERE status='qualified')  AS qualified,
         COUNT(*) FILTER (WHERE status='lost')        AS lost
       FROM leads`
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversion data' });
  }
});

module.exports = router;
