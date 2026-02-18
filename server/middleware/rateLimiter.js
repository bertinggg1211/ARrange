const rateLimit = require('express-rate-limit');

// Strict rate limiter for auth endpoints (login)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  // Skip successful requests (only count failures)
  skipSuccessfulRequests: true,
  // Using default keyGenerator which properly handles IPv6
});

// Moderate rate limiter for signup
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 signups per hour per IP
  message: {
    message: 'Too many accounts created from this IP. Please try again in 1 hour.',
    error: 'SIGNUP_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Using default keyGenerator which properly handles IPv6
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    message: 'Too many requests from this IP. Please slow down.',
    error: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Using default keyGenerator which properly handles IPv6
});

// Strict limiter for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    message: 'Too many password reset attempts. Please try again in 1 hour.',
    error: 'PASSWORD_RESET_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Using default keyGenerator which properly handles IPv6
});

module.exports = {
  authLimiter,
  signupLimiter,
  apiLimiter,
  passwordResetLimiter,
};
