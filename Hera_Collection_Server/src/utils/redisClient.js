import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Shared connection used for caching, rate limiting, and the Socket.io adapter.
// maxRetriesPerRequest: null is required for the Socket.io adapter's
// subscriber connection (it does its own long-lived subscribe loop).
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: false,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('Connected to Redis at', redisUrl.replace(/:[^:@]*@/, ':***@'));
});

export default redis;
