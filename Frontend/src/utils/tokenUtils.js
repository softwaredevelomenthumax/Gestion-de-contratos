/**
 * Utility functions for token management
 */

/**
 * Check if a JWT token is expired
 * @param {string} token - The JWT token to check
 * @returns {boolean} - True if token is expired, false otherwise
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000; // Convert to seconds
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true;
  }
};

/**
 * Get token expiration time
 * @param {string} token - The JWT token
 * @returns {Date|null} - Expiration date or null if invalid
 */
export const getTokenExpiration = (token) => {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

/**
 * Get time until token expires in minutes
 * @param {string} token - The JWT token
 * @returns {number} - Minutes until expiration, or -1 if expired/invalid
 */
export const getMinutesUntilExpiration = (token) => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return -1;
  
  const now = new Date();
  const timeDiff = expiration.getTime() - now.getTime();
  
  if (timeDiff <= 0) return -1;
  
  return Math.floor(timeDiff / (1000 * 60));
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
