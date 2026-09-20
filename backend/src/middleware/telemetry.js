const db = require('../db');

/**
 * Middleware: Logs request metadata and execution latency to telemetry_logs table
 * Powers the Admin / Observability Dashboard.
 */
function telemetryMiddleware(req, res, next) {
  const startTime = Date.now();

  res.on('finish', async () => {
    const rawUrl = req.originalUrl || req.url || '';

    // Exclude static assets, internal health pings, OPTIONS preflight, and observability self-polling
    if (
      req.method === 'OPTIONS' ||
      rawUrl === '/health' ||
      rawUrl.startsWith('/api/admin') ||
      rawUrl === '/favicon.ico'
    ) {
      return;
    }

    const latencyMs = Math.max(1, Date.now() - startTime);
    const endpoint = rawUrl.split('?')[0] || req.path || '/';
    const method = req.method;
    const statusCode = res.statusCode;

    try {
      await db.query(
        `INSERT INTO telemetry_logs (endpoint, method, status_code, latency_ms)
         VALUES ($1, $2, $3, $4)`,
        [endpoint, method, statusCode, latencyMs]
      );
    } catch (err) {
      // Telemetry failure must never crash or impact the active request cycle
      console.error('[Telemetry] Error logging request metric:', err.message);
    }
  });

  next();
}

module.exports = telemetryMiddleware;
