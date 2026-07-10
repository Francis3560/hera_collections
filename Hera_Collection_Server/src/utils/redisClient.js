import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Shared connection used for caching and rate limiting (request-path
// commands, run on every /api request via the global rate limiter). This
// MUST fail fast if Redis is unreachable — maxRetriesPerRequest: null tells
// ioredis to queue and retry forever instead of rejecting, which would hang
// every single request indefinitely if Redis is down or misconfigured,
// rather than degrading gracefully. The Socket.io adapter's pub/sub
// connections (which DO need maxRetriesPerRequest: null) are separate
// duplicated clients created in main.js with that override applied there.
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000),
  lazyConnect: false,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('Connected to Redis at', redisUrl.replace(/:[^:@]*@/, ':***@'));
});

export default redis;
