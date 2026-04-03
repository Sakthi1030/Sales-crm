/**
 * config/db.js — PostgreSQL connection pool via node-postgres (pg).
 * All queries in route files use `pool.query(sql, params)`.
 */

const { Pool } = require('pg');

const baseConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'nexus_crm',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    };

const pool = new Pool({
  ...baseConfig,
  // Keep a pool of up to 10 connections
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Verify the connection works on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log(`✅ Database connected at ${result.rows[0].now}`);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('   Make sure PostgreSQL is running and .env credentials are correct.');
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
