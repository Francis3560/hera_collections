import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../utils/redisClient.js';

// Redis-backed stores — rate limit counters are shared across every cluster
// worker and every app instance behind a load balancer, instead of each
// process/instance counting independently (which would let a client get N
// times the intended limit, once per process).
function makeStore(prefix) {
  return new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: `hera:ratelimit:${prefix}:`,
  });
}

// General API traffic — generous enough for normal browsing/checkout flows.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('api'),
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Brute-force target: login/signup/Google auth. Kept as its own bucket so a
// burst elsewhere (password reset, contact form) can't eat into a user's
// login-attempt budget, and vice versa — each sensitive-action family below
// gets its own Redis prefix instead of sharing one combined counter.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  store: makeStore('auth'),
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
});

// Password reset request/reset/change.
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  store: makeStore('password-reset'),
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
});

// Email verification send/resend/verify — guards a 6-digit code.
export const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  store: makeStore('verification'),
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
});

// Public contact form — spam/abuse guard, unrelated to auth brute-forcing.
export const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('contact'),
  message: { success: false, message: 'Too many messages sent. Please try again later.' },
});

// Payment webhooks/callbacks — server-to-server traffic, but still bounded against flooding.
export const paymentCallbackLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('payment'),
  message: { ResultCode: 1, ResultDesc: 'Too many requests' },
});
