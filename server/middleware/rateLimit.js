// ========== 简易内存限流中间件（按 IP+路径） ==========
// 没必要为这点功能引入 express-rate-limit 依赖

function createRateLimiter({ windowMs, max, message }) {
  const buckets = new Map(); // key: ip+route → { count, resetAt }

  // 周期性清理过期 bucket，避免内存无限增长
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
    }
  }, windowMs).unref();

  return function rateLimit(req, res, next) {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const key = ip + ':' + req.baseUrl + req.path;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count++;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: message || '请求过于频繁，请稍后再试',
        retryAfter
      });
    }
    next();
  };
}

module.exports = { createRateLimiter };
