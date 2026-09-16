/**
 * Request Input Sanitization Middleware
 * Sanitizes req.body, req.query, and req.params against injection attacks and malicious payloads.
 */

function sanitizeValue(value) {
  if (typeof value === 'string') {
    // 1. Strip null bytes
    let cleaned = value.replace(/\0/g, '');

    // 2. Remove dangerous inline script tags
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // 3. Neutralize javascript: pseudo-protocols in links
    cleaned = cleaned.replace(/javascript\s*:/gi, '');

    return cleaned;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (typeof value === 'object' && value !== null) {
    const sanitizedObj = {};
    for (const [k, v] of Object.entries(value)) {
      // Clean object key of null bytes as well
      const cleanKey = k.replace(/\0/g, '');
      sanitizedObj[cleanKey] = sanitizeValue(v);
    }
    return sanitizedObj;
  }

  return value;
}

export function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
}
