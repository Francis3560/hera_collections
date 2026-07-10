import { redis } from './redisClient.js';

// Shared Redis-backed cache — safe for multiple app instances behind a load
// balancer (all instances read/write the same cache, unlike a per-process
// in-memory cache). Falls back to calling fn() directly (no caching, just
// slower) if Redis is unreachable, so a Redis outage degrades gracefully
// instead of taking the app down.
const KEY_PREFIX = 'hera:cache:';

/**
 * Returns the cached value for `key`, or computes it via `fn`, caches it, and returns it.
 * @param {string} key
 * @param {number} ttlMs
 * @param {() => Promise<any>} fn
 */
export async function getOrSet(key, ttlMs, fn) {
  const fullKey = KEY_PREFIX + key;

  try {
    const cached = await redis.get(fullKey);
    if (cached !== null) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error(`Cache read failed for ${fullKey}, falling back to direct call:`, err.message);
    return fn();
  }

  const value = await fn();

  try {
    await redis.set(fullKey, JSON.stringify(value), 'PX', ttlMs);
  } catch (err) {
    console.error(`Cache write failed for ${fullKey}:`, err.message);
  }

  return value;
}

export async function invalidate(key) {
  try {
    await redis.del(KEY_PREFIX + key);
  } catch (err) {
    console.error(`Cache invalidate failed for ${key}:`, err.message);
  }
}

/**
 * Deletes every cached entry whose key starts with `prefix`. Uses SCAN
 * (non-blocking, cursor-based) rather than KEYS so it's safe even if the
 * keyspace grows large.
 * @param {string} prefix
 */
export async function invalidatePrefix(prefix) {
  const pattern = `${KEY_PREFIX}${prefix}*`;
  try {
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const keysToDelete = [];
    for await (const keys of stream) {
      keysToDelete.push(...keys);
    }
    if (keysToDelete.length > 0) {
      await redis.del(keysToDelete);
    }
  } catch (err) {
    console.error(`Cache invalidatePrefix failed for ${prefix}:`, err.message);
  }
}
