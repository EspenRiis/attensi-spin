/**
 * Simple client-side rate limiter to prevent abuse
 * Tracks actions in localStorage with expiry timestamps
 */

const RATE_LIMIT_PREFIX = 'rate_limit_';

/**
 * Check if an action is allowed based on rate limits
 * @param {string} action - Action identifier (e.g., 'add_participant', 'spin_wheel')
 * @param {number} maxAttempts - Maximum attempts allowed in the time window
 * @param {number} windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns {Object} { allowed: boolean, retryAfter: number|null }
 */
export const checkRateLimit = (action, maxAttempts, windowMs = 60000) => {
  const key = `${RATE_LIMIT_PREFIX}${action}`;
  const now = Date.now();

  try {
    // Get existing attempts
    const stored = localStorage.getItem(key);
    let attempts = stored ? JSON.parse(stored) : [];

    // Remove expired attempts (outside the time window)
    attempts = attempts.filter(timestamp => now - timestamp < windowMs);

    // Check if limit exceeded
    if (attempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...attempts);
      const retryAfter = Math.ceil((oldestAttempt + windowMs - now) / 1000); // seconds

      return {
        allowed: false,
        retryAfter,
        message: `Too many attempts. Please wait ${retryAfter} seconds.`
      };
    }

    // Add current attempt
    attempts.push(now);
    localStorage.setItem(key, JSON.stringify(attempts));

    return { allowed: true, retryAfter: null };
  } catch (error) {
    console.error('Rate limiter error:', error);
    // If localStorage fails, allow the action (fail open)
    return { allowed: true, retryAfter: null };
  }
};

/**
 * Reset rate limit for a specific action (useful after successful operations)
 * @param {string} action - Action identifier
 */
export const resetRateLimit = (action) => {
  const key = `${RATE_LIMIT_PREFIX}${action}`;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error resetting rate limit:', error);
  }
};

/**
 * Clean up expired rate limit entries (call periodically)
 */
export const cleanupRateLimits = () => {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(RATE_LIMIT_PREFIX)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const attempts = JSON.parse(stored);
          const hasRecentAttempts = attempts.some(timestamp => now - timestamp < maxAge);
          if (!hasRecentAttempts) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up rate limits:', error);
  }
};

// Rate limit configurations (exported for consistency)
export const RATE_LIMITS = {
  ADD_PARTICIPANT: { maxAttempts: 10, windowMs: 60000 }, // 10 per minute
  SPIN_WHEEL: { maxAttempts: 5, windowMs: 60000 }, // 5 spins per minute
  REMOVE_PARTICIPANT: { maxAttempts: 15, windowMs: 60000 }, // 15 per minute
  REGISTRATION: { maxAttempts: 3, windowMs: 60000 }, // 3 registrations per minute
};
