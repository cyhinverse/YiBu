const BEARER_PREFIX = 'Bearer ';

export const stripBearerToken = (token, options = {}) => {
  const { allowRawToken = true } = options;

  if (!token || typeof token !== 'string') return null;
  const normalizedToken = token.trim();
  if (!normalizedToken) return null;

  if (normalizedToken.startsWith(BEARER_PREFIX)) {
    const parsed = normalizedToken.slice(BEARER_PREFIX.length).trim();
    return parsed || null;
  }

  return allowRawToken ? normalizedToken : null;
};

export const parseCookieHeader = cookieHeader => {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};

  return cookieHeader.split(';').reduce((acc, item) => {
    const [rawKey, ...rest] = item.split('=');
    const key = rawKey?.trim();
    if (!key) return acc;

    const rawValue = rest.join('=').trim();
    try {
      acc[key] = decodeURIComponent(rawValue);
    } catch {
      acc[key] = rawValue;
    }
    return acc;
  }, {});
};

export const getAccessTokenFromRequest = req => {
  const cookieToken = req.cookies?.accessToken;
  if (cookieToken) return cookieToken;

  return stripBearerToken(req.headers?.authorization, { allowRawToken: false });
};

export const getAccessTokenFromHandshake = handshake => {
  const authToken = handshake?.auth?.token || handshake?.auth?.accessToken;
  const normalizedAuthToken = stripBearerToken(authToken);
  if (normalizedAuthToken) return normalizedAuthToken;

  const normalizedHeaderToken = stripBearerToken(handshake?.headers?.authorization);
  if (normalizedHeaderToken) return normalizedHeaderToken;

  const cookies = parseCookieHeader(handshake?.headers?.cookie);
  return cookies.accessToken || null;
};

