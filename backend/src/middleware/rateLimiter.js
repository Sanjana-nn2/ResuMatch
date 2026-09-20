const rateLimit = require('express-rate-limit');

// Strict rate limiter for public demo mode (prevents ML compute abuse from non-authenticated users)
const demoRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Limit each IP to 10 demo analyses per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demo rate limit exceeded. Please sign up for a free account to run unlimited resume analyses.',
    retryAfterMinutes: 15,
  },
});

// Authentication rate limiter (prevents brute-force credential stuffing)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 login/register attempts per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again later.',
  },
});

module.exports = {
  demoRateLimiter,
  authRateLimiter,
};
