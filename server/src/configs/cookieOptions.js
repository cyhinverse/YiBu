/**
 * Cookie Options Helper
 * Provides consistent cookie configuration for authentication tokens
 */

const isProduction = process.env.NODE_ENV === 'production';

// Allow explicit overrides (useful for local Docker over plain HTTP).
const cookieSecure =
  typeof process.env.COOKIE_SECURE === 'string'
    ? process.env.COOKIE_SECURE === 'true'
    : isProduction;

const cookieSameSite =
  process.env.COOKIE_SAMESITE || (isProduction ? 'strict' : 'lax');

const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

const withCommonCookieOptions = options => {
  const base = {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
    path: '/',
  };
  if (cookieDomain) base.domain = cookieDomain;
  return { ...base, ...options };
};


/**
 * Get cookie options for access token
 * @returns {Object} Cookie options for access token
 */
export const getAccessTokenCookieOptions = () =>
  withCommonCookieOptions({
    maxAge: 60 * 60 * 1000, // 1 hour
  });


/**
 * Get cookie options for refresh token
 * @returns {Object} Cookie options for refresh token
 */
export const getRefreshTokenCookieOptions = () =>
  withCommonCookieOptions({
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
  res.clearCookie('accessToken', withCommonCookieOptions({}));
  res.clearCookie('refreshToken', withCommonCookieOptions({}));
};
