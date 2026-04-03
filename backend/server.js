/**
 * server.js - Nexus CRM Express Server
 * Entry point: sets up middleware, mounts routes, and starts HTTP server.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('./config/db');
const { seed } = require('../database/seed');

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const customerRoutes = require('./routes/customers');
const dealRoutes = require('./routes/deals');
const taskRoutes = require('./routes/tasks');
const reportRoutes = require('./routes/reports');
const teamRoutes = require('./routes/team');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Nexus CRM API',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/team', teamRoutes);

const frontendBuildDir = path.join(__dirname, '..', 'frontend', 'build');
const frontendIndexFile = path.join(frontendBuildDir, 'index.html');

if (fs.existsSync(frontendIndexFile)) {
  app.use(express.static(frontendBuildDir));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return res.sendFile(frontendIndexFile);
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

async function ensureSeeded() {
  const shouldAutoSeed = process.env.AUTO_SEED !== 'false';
  if (!shouldAutoSeed) return;

  const tableCheck = await pool.query(`SELECT to_regclass('public.users') AS users_table`);
  const usersTableExists = Boolean(tableCheck.rows[0]?.users_table);

  if (!usersTableExists) {
    console.log('Users table not found. Running initial seed...');
    await seed({ closePool: false });
    return;
  }

  const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  const userCount = countResult.rows[0]?.count || 0;
  if (userCount === 0) {
    console.log('Users table is empty. Running initial seed...');
    await seed({ closePool: false });
  }
}

async function start() {
  await testConnection();
  await ensureSeeded();
  app.listen(PORT, () => {
    console.log(`Nexus CRM API running on http://localhost:${PORT}`);
    console.log(`ENV: ${process.env.NODE_ENV}`);
    console.log(`DB: ${process.env.DB_NAME || 'via DATABASE_URL'}`);
  });
}

start();
