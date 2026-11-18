function createRateLimiter({ windowMs = 60_000, maxRequests = 30, code = "RATE_LIMIT_EXCEEDED" } = {}) {
  const buckets = new Map();

  return function rateLimiter(req, res, next) {
    if (process.env.DISABLE_RATE_LIMIT === "true") {
      return next();
    }

    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const entry = buckets.get(key);

    if (!entry || now >= entry.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code,
          message:
            "Demasiadas solicitudes en poco tiempo. Por favor intenta nuevamente en unos segundos.",
        },
      });
    }

    entry.count += 1;
    return next();
  };
}

module.exports = createRateLimiter;
