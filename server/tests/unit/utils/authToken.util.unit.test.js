import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  stripBearerToken,
  parseCookieHeader,
  getAccessTokenFromRequest,
  getAccessTokenFromHandshake,
} from '../../../src/utils/authToken.js';

describe('utils/authToken', () => {
  it('stripBearerToken should parse bearer token and reject empty token', () => {
    assert.equal(stripBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
    assert.equal(stripBearerToken('Bearer   '), 'Bearer');
  });

  it('stripBearerToken should return null for raw token when allowRawToken=false', () => {
    assert.equal(stripBearerToken('raw-token', { allowRawToken: false }), null);
  });

  it('parseCookieHeader should parse and decode cookies', () => {
    const cookies = parseCookieHeader('foo=bar; accessToken=a%2Eb%2Ec');

    assert.deepEqual(cookies, {
      foo: 'bar',
      accessToken: 'a.b.c',
    });
  });

  it('parseCookieHeader should keep raw value when cookie decode fails', () => {
    const cookies = parseCookieHeader('bad=%E0%A4%A; ok=value');

    assert.equal(cookies.bad, '%E0%A4%A');
    assert.equal(cookies.ok, 'value');
  });

  it('getAccessTokenFromRequest should prefer cookie over authorization header', () => {
    const token = getAccessTokenFromRequest({
      cookies: { accessToken: 'cookie-token' },
      headers: { authorization: 'Bearer header-token' },
    });

    assert.equal(token, 'cookie-token');
  });

  it('getAccessTokenFromHandshake should resolve token by priority order', () => {
    const fromAuth = getAccessTokenFromHandshake({
      auth: { token: 'Bearer auth-token' },
      headers: {},
    });
    assert.equal(fromAuth, 'auth-token');

    const fromHeader = getAccessTokenFromHandshake({
      auth: {},
      headers: { authorization: 'Bearer header-token' },
    });
    assert.equal(fromHeader, 'header-token');

    const fromCookie = getAccessTokenFromHandshake({
      auth: {},
      headers: { cookie: 'accessToken=cookie-token' },
    });
    assert.equal(fromCookie, 'cookie-token');
  });
});
