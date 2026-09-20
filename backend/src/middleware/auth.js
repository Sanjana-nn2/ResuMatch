const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_928374';

/**
 * Middleware: Verify Bearer JWT Token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      error: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, fullName }
    next();
  } catch (err) {
    return res.status(403).json({
      error: 'Invalid or expired token. Please log in again.',
    });
  }
}

/**
 * Optional Authentication: Attach user if token is valid, but proceed anyway if not.
 * Essential for public demo mode.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth,
  JWT_SECRET,
};
