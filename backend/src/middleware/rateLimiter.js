/**
 * In-memory sliding window rate limiter middleware
 */
export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests, please try again later.',
} = {}) {
  const hits = new Map();

  return (req, res, next) => {
    // Bypass in test environment unless explicitly testing rate limits
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const key =
      req.ip ||
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const now = Date.now();
    const windowStart = now - windowMs;

    let timestamps = hits.get(key) || [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= max) {
      const resetSeconds = Math.max(1, Math.ceil((timestamps[0] + windowMs - now) / 1000));
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfter: resetSeconds,
      });
    }

    timestamps.push(now);
    hits.set(key, timestamps);

    // Periodically prune stale entries
    if (hits.size > 5000) {
      for (const [k, v] of hits.entries()) {
        if (v.length === 0 || v[v.length - 1] <= windowStart) {
          hits.delete(k);
        }
      }
    }

    next();
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'API rate limit exceeded. Please throttle your requests.',
});
