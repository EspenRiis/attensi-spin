// Session management for isolating user data

const SESSION_KEY = 'attensi-spin-session-id';

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
 * Get the current session ID from localStorage
 * Returns null if no session exists
 */
export const getCurrentSessionId = () => {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch (error) {
    console.error('Error reading session ID:', error);
    return null;
  }
};

/**
 * Create a new session and store it in localStorage
 * Returns the new session ID
 */
export const createNewSession = () => {
  const sessionId = generateSessionId();
  try {
    localStorage.setItem(SESSION_KEY, sessionId);
    return sessionId;
  } catch (error) {
    console.error('Error creating session:', error);
    return sessionId; // Return it anyway, even if storage fails
  }
};

/**
 * Clear the current session from localStorage
 */
export const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

/**
 * Check if a session exists in localStorage
 */
export const hasSession = () => {
  return getCurrentSessionId() !== null;
};
