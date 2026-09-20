const express = require('express');
const cors = require('cors');
require('dotenv').config();

const telemetryMiddleware = require('./middleware/telemetry');
const authRoutes = require('./routes/auth.routes');
const resumeRoutes = require('./routes/resume.routes');
const analyzeRoutes = require('./routes/analyze.routes');
const reportRoutes = require('./routes/report.routes');
const adminRoutes = require('./routes/admin.routes');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Render's reverse proxy
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// Core Middleware
// ---------------------------------------------------------------------------
const allowedOrigins = [
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
  'ionic://localhost',
];

if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((url) => {
    const trimmed = url.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile WebView AssetLoader, mobile native HTTP, curl, server-to-server)
    if (!origin) return callback(null, true);

    // In development or if explicitly set to wildcard, allow all
    if (process.env.NODE_ENV !== 'production' || process.env.CLIENT_URL === '*') {
      return callback(null, true);
    }

    if (
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('https://localhost:')
    ) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not permitted by CORS policy.`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Telemetry logging middleware for system observability
app.use(telemetryMiddleware);

// ---------------------------------------------------------------------------
// Health Check Endpoint (For Docker & Cloud Monitoring)
// ---------------------------------------------------------------------------
app.get('/health', async (req, res) => {
  let dbOk = false;
  try {
    await db.query('SELECT 1');
    dbOk = true;
  } catch (e) {
    dbOk = false;
  }

  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'healthy' : 'degraded',
    service: 'resumatch-node-backend',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// API Route Registrations
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// ---------------------------------------------------------------------------
// Global 404 and Error Handling Middleware
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err.stack);
  res.status(500).json({
    error: 'An internal server error occurred.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ---------------------------------------------------------------------------
// Server Initialization
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(` ResuMatch Node.js API running on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` ML Microservice URL: ${process.env.ML_SERVICE_URL || 'http://localhost:8000'}`);
    console.log(`===============================================`);
  });
}

module.exports = app;
