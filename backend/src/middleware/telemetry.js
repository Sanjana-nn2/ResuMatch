const db = require('../db');

/**
 * Middleware: Logs request metadata and execution latency to telemetry_logs table
 * Powers the Admin / Observability Dashboard.
 */
function telemetryMiddleware(req, res, next) {
  const startTime = Date.now();

  res.on('finish', async () => {
    // Exclude static assets or internal health pings from filling log tables
    if (req.originalUrl === '/health') return;

    const latencyMs = Date.now() - startTime;
    const endpoint = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
    const method = req.method;
    const statusCode = res.statusCode;

    try {
      await db.query(
        `INSERT INTO telemetry_logs (endpoint, method, status_code, latency_ms)
         VALUES ($1, $2, $3, $4)`,
        [endpoint, method, statusCode, latencyMs]
      );
    } catch (err) {
      // Telemetry should never crash the active request cycle
      console.error('[Telemetry] Error logging request metric:', err.message);
    }
  });

  next();
}

module.exports = telemetryMiddleware;
