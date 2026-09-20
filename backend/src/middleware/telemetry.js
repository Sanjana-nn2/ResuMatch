const db = require('../db');

/**
 * Middleware: Logs request metadata and execution latency to telemetry_logs table
 * Powers the Admin / Observability Dashboard.
 */
function telemetryMiddleware(req, res, next) {
  const startTime = Date.now();

  res.on('finish', async () => {
    // Normalize path by stripping query strings and trailing slashes (except root '/')
    const rawUrl = req.originalUrl || req.url || '';
    const pathname = (rawUrl.split('?')[0] || req.path || '/').replace(/\/+$/, '') || '/';

    // Exclude static assets, internal health probes, root platform pings, OPTIONS preflight, and admin/observability self-polling
    if (
      req.method === 'OPTIONS' ||
      pathname === '/' ||
      pathname === '/health' ||
      pathname === '/favicon.ico' ||
      pathname.startsWith('/api/admin')
    ) {
      return;
    }

    const latencyMs = Math.max(1, Date.now() - startTime);
    const endpoint = pathname;
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
