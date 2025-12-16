/**
 * Input Validation and Sanitization Utilities
 * Purpose: Protect against XSS, injection attacks, and invalid data
 * Security: Defense in depth - validates before React's built-in escaping
 */

// ============================================
// CONSTANTS
// ============================================

export const VALIDATION_RULES = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 50,
  // Accept both UUID format and custom timestamp-based format (timestamp-random)
  SESSION_ID_PATTERN: /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-z]+-[0-9a-z]+)$/i,
};

// Characters that are explicitly forbidden in names
const FORBIDDEN_CHARS = [
  '<', '>', // HTML tags
  '{', '}', // Template literals
  '\\', // Escape sequences
];

// Patterns that indicate potential XSS or injection attempts
const SUSPICIOUS_PATTERNS = [
  /<script/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /javascript:/i,
  /on\w+=/i, // Event handlers like onclick=
  /data:text\/html/i,
  /<svg.*onload/i,
  /eval\(/i,
  /expression\(/i,
];

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate participant name
 * @param {string} name - The name to validate
 * @returns {Object} - { valid: boolean, error: string|null, sanitized: string|null }
 */
export function validateName(name) {
  // Check if name exists
  if (!name) {
    return {
      valid: false,
      error: 'Name cannot be empty',
      sanitized: null,
    };
  }

  // Convert to string and trim
  const trimmed = String(name).trim();

  // Check minimum length
  if (trimmed.length < VALIDATION_RULES.NAME_MIN_LENGTH) {
    return {
      valid: false,
      error: 'Name is too short',
      sanitized: null,
    };
  }

  // Check maximum length
  if (trimmed.length > VALIDATION_RULES.NAME_MAX_LENGTH) {
    return {
      valid: false,
      error: `Name must be ${VALIDATION_RULES.NAME_MAX_LENGTH} characters or less`,
      sanitized: null,
    };
  }

  // Check for forbidden characters
  const hasForbiddenChars = FORBIDDEN_CHARS.some(char => trimmed.includes(char));
  if (hasForbiddenChars) {
    return {
      valid: false,
      error: 'Name contains invalid characters',
      sanitized: null,
    };
  }

  // Check for suspicious patterns (XSS attempts)
  const hasSuspiciousPattern = SUSPICIOUS_PATTERNS.some(pattern =>
    pattern.test(trimmed)
  );
  if (hasSuspiciousPattern) {
    return {
      valid: false,
      error: 'Name contains invalid content',
      sanitized: null,
    };
  }

  // Sanitize: remove any zero-width characters and normalize whitespace
  const sanitized = trimmed
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .replace(/\s+/g, ' '); // Normalize whitespace

  return {
    valid: true,
    error: null,
    sanitized,
  };
}

/**
 * Validate session ID (UUID format)
 * @param {string} sessionId - The session ID to validate
 * @returns {boolean} - True if valid UUID
 */
export function validateSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    return false;
  }

  return VALIDATION_RULES.SESSION_ID_PATTERN.test(sessionId);
}

/**
 * Validate email address (basic validation)
 * @param {string} email - The email to validate
 * @returns {Object} - { valid: boolean, error: string|null }
 */
export function validateEmail(email) {
  if (!email) {
    return { valid: false, error: 'Email cannot be empty' };
  }

  const trimmed = String(email).trim();

  // Basic email pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check length
  if (trimmed.length > 254) { // RFC 5321
    return { valid: false, error: 'Email is too long' };
  }

  return { valid: true, error: null };
}

/**
 * Sanitize text for display (defense in depth)
 * Note: React already escapes text, but this provides an additional layer
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text
 */
export function sanitizeText(text) {
  if (!text) return '';

  return String(text)
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 1000); // Reasonable max length for any text
}

/**
 * Validate number within range
 * @param {number} value - The number to validate
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {boolean} - True if valid
 */
export function validateNumberInRange(value, min, max) {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Rate limiting helper: Check if action can be performed
 * Simple client-side rate limiting (not a security control, just UX)
 * @param {string} key - Unique key for the action
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} - { allowed: boolean, remainingAttempts: number, resetTime: number }
 */
export function checkRateLimit(key, maxAttempts = 10, windowMs = 60000) {
  const now = Date.now();
  const storageKey = `rateLimit_${key}`;

  // Get existing attempts
  let attempts = [];
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      attempts = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Rate limit check error:', error);
    attempts = [];
  }

  // Filter attempts within the time window
  attempts = attempts.filter(timestamp => now - timestamp < windowMs);

  // Check if limit exceeded
  if (attempts.length >= maxAttempts) {
    const oldestAttempt = Math.min(...attempts);
    const resetTime = oldestAttempt + windowMs;

    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime,
    };
  }

  // Add current attempt
  attempts.push(now);

  // Save to localStorage
  try {
    localStorage.setItem(storageKey, JSON.stringify(attempts));
  } catch (error) {
    console.error('Rate limit storage error:', error);
  }

  return {
    allowed: true,
    remainingAttempts: maxAttempts - attempts.length,
    resetTime: now + windowMs,
  };
}

/**
 * Clear rate limit for a specific key
 * @param {string} key - The rate limit key to clear
 */
export function clearRateLimit(key) {
  const storageKey = `rateLimit_${key}`;
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Clear rate limit error:', error);
  }
}

// ============================================
// EXPORT DEFAULT VALIDATION OBJECT
// ============================================

export default {
  validateName,
  validateSessionId,
  validateEmail,
  sanitizeText,
  validateNumberInRange,
  checkRateLimit,
  clearRateLimit,
  VALIDATION_RULES,
};
