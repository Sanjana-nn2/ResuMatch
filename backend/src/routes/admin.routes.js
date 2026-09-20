const express = require('express');
const db = require('../db');
const { checkMLHealth } = require('../utils/mlClient');

const router = express.Router();

/**
 * GET /api/admin/metrics
 * System Observability & Telemetry overview
 * Shows request counts, average latency, status code distribution, and ML service health
 */
router.get('/metrics', async (req, res) => {
  try {
    // 1. Check ML Microservice Connectivity & Health
    let mlStatus = { status: 'offline', latencyMs: 0 };
    const mlStart = Date.now();
    try {
      const healthData = await checkMLHealth();
      mlStatus = {
        status: healthData.status || 'healthy',
        model: healthData.model_name,
        latencyMs: Date.now() - mlStart,
      };
    } catch (mlErr) {
      mlStatus = { status: 'unreachable', error: mlErr.message, latencyMs: Date.now() - mlStart };
    }

    // 2. Fetch database telemetry statistics (last 24 hours)
    const statsQuery = `
      SELECT 
        COUNT(*) as total_requests,
        COALESCE(ROUND(AVG(latency_ms)), 0) as avg_latency_ms,
        COALESCE(MAX(latency_ms), 0) as max_latency_ms,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
      FROM telemetry_logs
      WHERE timestamp >= NOW() - INTERVAL '24 HOURS';
    `;
    const statsResult = await db.query(statsQuery);

    // 3. Endpoint breakdown
    const endpointQuery = `
      SELECT 
        endpoint,
        method,
        COUNT(*) as calls,
        ROUND(AVG(latency_ms)) as avg_latency
      FROM telemetry_logs
      WHERE timestamp >= NOW() - INTERVAL '24 HOURS'
      GROUP BY endpoint, method
      ORDER BY calls DESC
      LIMIT 10;
    `;
    const endpointResult = await db.query(endpointQuery);

    // 4. Status code distribution
    const statusQuery = `
      SELECT 
        status_code,
        COUNT(*) as count
      FROM telemetry_logs
      WHERE timestamp >= NOW() - INTERVAL '24 HOURS'
      GROUP BY status_code
      ORDER BY status_code ASC;
    `;
    const statusResult = await db.query(statusQuery);

    // 5. Total system analyses executed
    const analysisCountResult = await db.query('SELECT COUNT(*) FROM analyses');

    return res.json({
      uptimeSeconds: Math.floor(process.uptime()),
      mlService: mlStatus,
      summary: {
        totalRequests24h: parseInt(statsResult.rows[0].total_requests || 0, 10),
        avgLatencyMs: parseInt(statsResult.rows[0].avg_latency_ms || 0, 10),
        maxLatencyMs: parseInt(statsResult.rows[0].max_latency_ms || 0, 10),
        errorRate: statsResult.rows[0].total_requests > 0
          ? Number(((statsResult.rows[0].error_count / statsResult.rows[0].total_requests) * 100).toFixed(2))
          : 0,
        totalAnalysesLifetime: parseInt(analysisCountResult.rows[0].count || 0, 10),
      },
      topEndpoints: endpointResult.rows,
      statusCodeDistribution: statusResult.rows,
      nodeVersion: process.version,
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    });
  } catch (err) {
    console.error('[Admin Metrics Error]:', err);
    return res.status(500).json({ error: 'Failed to aggregate system metrics.' });
  }
});

module.exports = router;
