/**
 * Cookie Options Helper
 * Provides consistent cookie configuration for authentication tokens
 */

const isProduction = process.env.NODE_ENV === 'production';
const cookieSameSite = isProduction
  ? 'strict'
  : process.env.COOKIE_SAMESITE || 'lax';


/**
 * Get cookie options for access token
 * @returns {Object} Cookie options for access token
 */
export const getAccessTokenCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: cookieSameSite, // configurable for cross-origin in development
  maxAge: 60 * 60 * 1000, // 1 hour
});


/**
 * Get cookie options for refresh token
 * @returns {Object} Cookie options for refresh token
 */
export const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: cookieSameSite, // configurable for cross-origin in development
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});


/**
 * Set authentication cookies on response
 * @param {Object} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} [refreshToken] - Refresh token (optional)
 */
export const setAuthCookies = (res, accessToken, refreshToken = null) => {
  res.cookie('accessToken', accessToken, getAccessTokenCookieOptions());

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());
  }
};

/**
 * Clear authentication cookies from response
 * @param {Object} res - Express response object
 */
export const clearAuthCookies = res => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: cookieSameSite,
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: cookieSameSite,
  });
};

