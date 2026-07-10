import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Shared connection used for caching and rate limiting (request-path
// commands, run on every /api request via the global rate limiter). This
// MUST fail fast if Redis is unreachable:
//  - connectTimeout: ioredis defaults to 10s per connection attempt. Against
//    a genuinely unreachable host (wrong hostname, firewalled, not just
//    "nothing listening") that's 10s of dead time per attempt, and with
//    retries this compounded to 60+ seconds per request in testing.
//  - enableOfflineQueue: false means a command issued while disconnected
//    rejects immediately instead of queuing and waiting for a reconnect
//    that may never succeed — this is what actually eliminates the hang;
//    connectTimeout alone still leaves each retry waiting out the timeout.
//  - maxRetriesPerRequest: null tells ioredis to retry forever instead of
//    rejecting, which is needed for the Socket.io adapter's subscriber but
//    NOT here. Those pub/sub connections are separate duplicated clients
//    created in main.js with that override applied there.
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 1,
  connectTimeout: 2000,
  enableOfflineQueue: false,
  retryStrategy: (times) => Math.min(times * 500, 5000),
  lazyConnect: false,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('Connected to Redis at', redisUrl.replace(/:[^:@]*@/, ':***@'));
});

export default redis;
