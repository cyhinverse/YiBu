import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthCookies,
  clearAuthCookies,
} from '../../../src/configs/cookieOptions.js';
import { createMockResponse } from '../../shared/middlewareTestUtils.js';

describe('utils/cookieOptions', () => {
  it('cookie option helpers should include common security flags', () => {
    const accessOptions = getAccessTokenCookieOptions();
    const refreshOptions = getRefreshTokenCookieOptions();

    assert.equal(accessOptions.httpOnly, true);
    assert.equal(refreshOptions.httpOnly, true);
    assert.equal(accessOptions.path, '/');
    assert.equal(refreshOptions.path, '/');
    assert.equal(accessOptions.maxAge, 60 * 60 * 1000);
    assert.equal(refreshOptions.maxAge, 30 * 24 * 60 * 60 * 1000);
  });

  it('setAuthCookies should set access and optional refresh token cookies', () => {
    const res = createMockResponse();

    setAuthCookies(res, 'access-token', 'refresh-token');

    assert.ok(res.cookies.some(c => c.name === 'accessToken'));
    assert.ok(res.cookies.some(c => c.name === 'refreshToken'));
  });

  it('clearAuthCookies should clear both auth cookies', () => {
    const res = createMockResponse();

    clearAuthCookies(res);

    assert.ok(res.clearedCookies.some(c => c.name === 'accessToken'));
    assert.ok(res.clearedCookies.some(c => c.name === 'refreshToken'));
  });
});

