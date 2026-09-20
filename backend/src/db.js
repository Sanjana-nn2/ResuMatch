const { Pool } = require('pg');
require('dotenv').config();

// Initialize PostgreSQL connection pool
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/resumatch';
const isLocalOrDockerInternal = dbUrl.includes('@postgres:') || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
const useSSL = process.env.DATABASE_SSL === 'true' || (process.env.NODE_ENV === 'production' && !isLocalOrDockerInternal);

const pool = new Pool({
  connectionString: dbUrl,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  max: 20, // Max concurrent connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log('[Database] Connected to PostgreSQL successfully.');
});

pool.on('error', (err) => {
  console.error('[Database] Unexpected PostgreSQL client error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
