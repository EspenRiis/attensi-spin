// Session management for isolating user data

// Feature-specific session keys
const SESSION_KEYS = {
  roulette: 'attensi-spin-session-id-roulette',
  scramble: 'attensi-spin-session-id-scramble',
  default: 'attensi-spin-session-id' // Legacy key for backwards compatibility
};

/**
 * Generate a unique session ID
 * Format: timestamp-random to ensure uniqueness
 */
export const generateSessionId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${randomPart}`;
};

/**
 * Get the session key for a specific feature
 * @param {string} feature - 'roulette', 'scramble', or null for default
 */
const getSessionKey = (feature = null) => {
  return SESSION_KEYS[feature] || SESSION_KEYS.default;
};

/**
 * Get the current session ID from localStorage
 * @param {string} feature - Optional feature name ('roulette', 'scramble')
 * Returns null if no session exists
 */
export const getCurrentSessionId = (feature = null) => {
  try {
    return localStorage.getItem(getSessionKey(feature));
  } catch (error) {
    console.error('Error reading session ID:', error);
    return null;
  }
};

/**
 * Create a new session and store it in localStorage
 * @param {string} feature - Optional feature name ('roulette', 'scramble')
 * Returns the new session ID
 */
export const createNewSession = (feature = null) => {
  const sessionId = generateSessionId();
  try {
    localStorage.setItem(getSessionKey(feature), sessionId);
    return sessionId;
  } catch (error) {
    console.error('Error creating session:', error);
    return sessionId; // Return it anyway, even if storage fails
  }
};

/**
 * Clear the current session from localStorage
 * @param {string} feature - Optional feature name ('roulette', 'scramble')
 */
export const clearSession = (feature = null) => {
  try {
    localStorage.removeItem(getSessionKey(feature));
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

/**
 * Check if a session exists in localStorage
 * @param {string} feature - Optional feature name ('roulette', 'scramble')
 */
export const hasSession = (feature = null) => {
  return getCurrentSessionId(feature) !== null;
};
