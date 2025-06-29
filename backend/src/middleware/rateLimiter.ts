import rateLimit from 'express-rate-limit';

// Define various rate limiters for different API endpoints
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts, please try again after 15 minutes'
  }
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 accounts per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many accounts created from this IP, please try again after an hour'
  }
});

export const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // 100 requests per 10 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP, please try again after 10 minutes'
  }
});

// More specific rate limiters
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Message sending rate limit reached, please try again after a minute'
  }
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Upload limit reached, please try again after an hour'
  }
}); 