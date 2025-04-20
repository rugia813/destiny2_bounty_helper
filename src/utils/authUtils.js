import * as api from '../api';
import * as cookie from '../cookie';

/**
 * Handle authorization code from OAuth flow
 * @param {string} code - The authorization code
 * @returns {Promise<Object>} Result object with success status and any error
 */
export async function handleAuthCode(code) {
  try {
    const tokenResponse = await api.getToken(code);
    return {
      success: tokenResponse.success,
      error: tokenResponse.error
    };
  } catch (error) {
    console.error("Error during auth code handling:", error);
    return {
      success: false,
      error: "Unexpected error during login"
    };
  }
}

/**
 * Refresh the auth token
 * @param {string} refreshToken - The refresh token to use
 * @returns {Promise<Object>} Result object with success status and any error
 */
export async function refreshAuthToken(refreshToken) {
  if (!refreshToken) {
    cookie.clearToken();
    return { success: false, error: "No refresh token available" };
  }

  try {
    const response = await api.refresh(refreshToken);
    if (!response.success) {
      cookie.clearToken();
      return {
        success: false,
        error: response.error || "Token refresh failed"
      };
    }
    return { success: true };
  } catch (error) {
    console.error('Unexpected error during token refresh:', error);
    cookie.clearToken();
    return {
      success: false,
      error: "Unexpected error during token refresh"
    };
  }
}

/**
 * Get URL parameters after OAuth redirect
 * @returns {Object} Object containing any URL parameters
 */
export function getAuthParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error')
  };
}

/**
 * Clean up the URL after OAuth redirect
 */
export function cleanupAuthRedirect() {
  window.history.replaceState({}, document.title, window.location.pathname);
}

/**
 * Setup OAuth popup message handler
 * @param {Function} handleCode - Function to call with received code
 */
export function setupAuthPopupHandler(handleCode) {
  window.setCode = handleCode;
}

/**
 * Launch OAuth popup
 * @returns {Window|null} The popup window object or null if blocked
 */
export function launchAuthPopup() {
  return api.authorize();
}