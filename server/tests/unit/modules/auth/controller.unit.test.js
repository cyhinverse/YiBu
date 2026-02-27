import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import AuthController from '../../../../src/modules/auth/auth.controller.js';
import AuthService from '../../../../src/modules/auth/auth.service.js';
import {
  createMockResponse,
  runMiddleware,
} from '../../../shared/middlewareTestUtils.js';

describe('AuthController', () => {
  const USER_ID = '507f191e810c19729de860ea';

  it('Register should return bad request when required fields are missing', async () => {
    const req = { body: { email: 'user@example.com' } };
    const res = createMockResponse();

    const error = await runMiddleware(AuthController.Register, req, res);

    assert.equal(error.statusCode, 400);
  });

  it('Register should return bad request when username is missing', async () => {
    const req = {
      body: {
        name: 'Test User',
        email: 'user@example.com',
        password: 'StrongPass1',
      },
    };
    const res = createMockResponse();

    const error = await runMiddleware(AuthController.Register, req, res);

    assert.equal(error.statusCode, 400);
  });

  it('Register should call service and set auth cookies', async () => {
    const originalRegister = AuthService.register;
    let receivedPayload;

    AuthService.register = async payload => {
      receivedPayload = payload;
      return {
        user: { id: USER_ID, email: payload.email },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
    };

    try {
      const req = {
        body: {
          name: 'Test User',
          email: 'user@example.com',
          password: 'StrongPass1',
          username: 'testuser',
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(AuthController.Register, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedPayload.username, 'testuser');
      assert.equal(res.statusCode, 201);
      assert.ok(res.cookies.some(cookie => cookie.name === 'accessToken'));
      assert.ok(res.cookies.some(cookie => cookie.name === 'refreshToken'));
    } finally {
      AuthService.register = originalRegister;
    }
  });

  it('Login should return bad request when email/password is missing', async () => {
    const req = { body: { email: 'user@example.com' } };
    const res = createMockResponse();

    const error = await runMiddleware(AuthController.Login, req, res);

    assert.equal(error.statusCode, 400);
  });

  it('Login should call service and set auth cookies', async () => {
    const originalLogin = AuthService.login;
    let receivedCredentials;
    let receivedDeviceInfo;

    AuthService.login = async (credentials, deviceInfo) => {
      receivedCredentials = credentials;
      receivedDeviceInfo = deviceInfo;
      return {
        user: { id: '507f191e810c19729de860ea' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
    };

    try {
      const req = {
        body: { email: 'user@example.com', password: 'StrongPass1' },
        headers: { 'user-agent': 'test-agent' },
        ip: '127.0.0.1',
      };
      const res = createMockResponse();

      const error = await runMiddleware(AuthController.Login, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedCredentials.email, 'user@example.com');
      assert.equal(receivedDeviceInfo.userAgent, 'test-agent');
      assert.equal(res.statusCode, 200);
      assert.ok(res.cookies.some(cookie => cookie.name === 'accessToken'));
      assert.ok(res.cookies.some(cookie => cookie.name === 'refreshToken'));
    } finally {
      AuthService.login = originalLogin;
    }
  });

  it('Login should fallback to connection remoteAddress and default platform', async () => {
    const originalLogin = AuthService.login;
    let receivedDeviceInfo;

    AuthService.login = async (_credentials, deviceInfo) => {
      receivedDeviceInfo = deviceInfo;
      return {
        user: { id: USER_ID },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
    };

    try {
      const req = {
        body: { email: 'user@example.com', password: 'StrongPass1' },
        headers: { 'user-agent': 'test-agent' },
        connection: { remoteAddress: '10.0.0.10' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(AuthController.Login, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedDeviceInfo.ip, '10.0.0.10');
      assert.equal(receivedDeviceInfo.platform, 'web');
    } finally {
      AuthService.login = originalLogin;
    }
  });

  it('RefreshToken should return unauthorized when refresh token is missing', async () => {
    const req = { cookies: {}, body: {} };
    const res = createMockResponse();

    const error = await runMiddleware(AuthController.RefreshToken, req, res);

    assert.equal(error.statusCode, 401);
  });

  it('RefreshToken should call service and set renewed cookies', async () => {
    const originalRefreshToken = AuthService.refreshToken;
    let receivedArgs;

    AuthService.refreshToken = async (...args) => {
      receivedArgs = args;
      return { accessToken: 'new-access', refreshToken: 'new-refresh' };
    };

    try {
      const req = {
        cookies: { refreshToken: 'old-refresh' },
        headers: { 'user-agent': 'agent-1' },
        ip: '127.0.0.2',
      };
      const res = createMockResponse();

      const error = await runMiddleware(AuthController.RefreshToken, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedArgs[0], 'old-refresh');
      assert.equal(receivedArgs[1].userAgent, 'agent-1');
      assert.equal(receivedArgs[1].ip, '127.0.0.2');
      assert.equal(res.statusCode, 200);
      assert.ok(res.cookies.some(cookie => cookie.name === 'accessToken'));
      assert.ok(res.cookies.some(cookie => cookie.name === 'refreshToken'));
    } finally {
      AuthService.refreshToken = originalRefreshToken;
    }
  });

  it('GetMe should return current authenticated user', async () => {
    const originalGetCurrentUser = AuthService.getCurrentUser;
    let receivedUserId;

    AuthService.getCurrentUser = async userId => {
      receivedUserId = userId;
      return { _id: USER_ID, email: 'user@example.com' };
    };

    try {
      const req = { user: { id: USER_ID } };
      const res = createMockResponse();

      const error = await runMiddleware(AuthController.GetMe, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedUserId, USER_ID);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.data._id, USER_ID);
    } finally {
      AuthService.getCurrentUser = originalGetCurrentUser;
    }
  });

  it('Logout should call service with refresh token and clear cookies', async () => {
    const originalLogout = AuthService.logout;
    let receivedToken;

    AuthService.logout = async token => {
      receivedToken = token;
    };

    try {
      const req = { cookies: {}, body: { refreshToken: 'token-from-body' } };
      const res = createMockResponse();

      const error = await runMiddleware(AuthController.Logout, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedToken, 'token-from-body');
      assert.equal(res.statusCode, 200);
      assert.ok(
        res.clearedCookies.some(cookie => cookie.name === 'accessToken')
      );
      assert.ok(
        res.clearedCookies.some(cookie => cookie.name === 'refreshToken')
      );
    } finally {
      AuthService.logout = originalLogout;
    }
  });

  it('LogoutAllDevices should call service and clear cookies', async () => {
    const originalLogoutAllDevices = AuthService.logoutAllDevices;
    let receivedUserId;

    AuthService.logoutAllDevices = async userId => {
      receivedUserId = userId;
    };

    try {
      const req = { user: { id: USER_ID } };
      const res = createMockResponse();

      const error = await runMiddleware(AuthController.LogoutAllDevices, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedUserId, USER_ID);
      assert.equal(res.statusCode, 200);
      assert.ok(
        res.clearedCookies.some(cookie => cookie.name === 'accessToken')
      );
    } finally {
      AuthService.logoutAllDevices = originalLogoutAllDevices;
    }
  });

  it('UpdatePassword should validate required fields and min length', async () => {
    {
      const req = { body: { currentPassword: 'old' }, user: { id: USER_ID } };
      const res = createMockResponse();
      const error = await runMiddleware(AuthController.UpdatePassword, req, res);
      assert.equal(error.statusCode, 400);
    }

    {
      const req = {
        body: { currentPassword: 'old', newPassword: '123' },
        user: { id: USER_ID },
      };
      const res = createMockResponse();
      const error = await runMiddleware(AuthController.UpdatePassword, req, res);
      assert.equal(error.statusCode, 400);
    }
  });

  it('UpdatePassword should call service and clear auth cookies on success', async () => {
    const originalChangePassword = AuthService.changePassword;
    let receivedArgs;

    AuthService.changePassword = async (...args) => {
      receivedArgs = args;
    };

    try {
      const req = {
        body: { currentPassword: 'old-pass', newPassword: 'new-pass-123' },
        user: { id: USER_ID },
      };
      const res = createMockResponse();

      const error = await runMiddleware(AuthController.UpdatePassword, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [USER_ID, 'old-pass', 'new-pass-123']);
      assert.equal(res.statusCode, 200);
      assert.ok(
        res.clearedCookies.some(cookie => cookie.name === 'refreshToken')
      );
    } finally {
      AuthService.changePassword = originalChangePassword;
    }
  });

  it('RequestPasswordReset should validate email and call service', async () => {
    {
      const req = { body: {} };
      const res = createMockResponse();
      const error = await runMiddleware(
        AuthController.RequestPasswordReset,
        req,
        res
      );
      assert.equal(error.statusCode, 400);
    }

    const originalRequestPasswordReset = AuthService.requestPasswordReset;
    let receivedEmail;

    AuthService.requestPasswordReset = async email => {
      receivedEmail = email;
    };

    try {
      const req = { body: { email: 'user@example.com' } };
      const res = createMockResponse();

      const error = await runMiddleware(
        AuthController.RequestPasswordReset,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.equal(receivedEmail, 'user@example.com');
      assert.equal(res.statusCode, 200);
    } finally {
      AuthService.requestPasswordReset = originalRequestPasswordReset;
    }
  });

  it('ResetPassword should validate required payload and minimum length', async () => {
    {
      const req = { body: { token: 'token-only' } };
      const res = createMockResponse();
      const error = await runMiddleware(AuthController.ResetPassword, req, res);
      assert.equal(error.statusCode, 400);
    }

    {
      const req = { body: { token: 'token', newPassword: '123' } };
      const res = createMockResponse();
      const error = await runMiddleware(AuthController.ResetPassword, req, res);
      assert.equal(error.statusCode, 400);
    }
  });

  it('ResetPassword should call service on valid payload', async () => {
    const originalResetPassword = AuthService.resetPassword;
    let receivedToken;
    let receivedNewPassword;

    AuthService.resetPassword = async (token, newPassword) => {
      receivedToken = token;
      receivedNewPassword = newPassword;
    };

    try {
      const req = {
        body: { token: 'reset-token', newPassword: 'StrongPass1' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(AuthController.ResetPassword, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedToken, 'reset-token');
      assert.equal(receivedNewPassword, 'StrongPass1');
      assert.equal(res.statusCode, 200);
    } finally {
      AuthService.resetPassword = originalResetPassword;
    }
  });

  it('EnableTwoFactor should return qr setup data from service', async () => {
    const originalEnableTwoFactor = AuthService.enableTwoFactor;
    let receivedUserId;

    AuthService.enableTwoFactor = async userId => {
      receivedUserId = userId;
      return { secret: 'secret', qrCode: 'data:image/png;base64,abc' };
    };

    try {
      const req = { user: { id: USER_ID } };
      const res = createMockResponse();

      const error = await runMiddleware(AuthController.EnableTwoFactor, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedUserId, USER_ID);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.data.secret, 'secret');
    } finally {
      AuthService.enableTwoFactor = originalEnableTwoFactor;
    }
  });

  it('VerifyTwoFactor should require token', async () => {
    const req = { user: { id: USER_ID }, body: {} };
    const res = createMockResponse();

    const error = await runMiddleware(AuthController.VerifyTwoFactor, req, res);

    assert.equal(error.statusCode, 400);
  });

  it('VerifyTwoFactor should delegate to service and return backup codes', async () => {
    const originalVerifyAndEnableTwoFactor = AuthService.verifyAndEnableTwoFactor;
    let receivedArgs;

    AuthService.verifyAndEnableTwoFactor = async (...args) => {
      receivedArgs = args;
      return { backupCodes: ['code-1', 'code-2'] };
    };

    try {
      const req = { user: { id: USER_ID }, body: { token: '123456' } };
      const res = createMockResponse();

      const error = await runMiddleware(AuthController.VerifyTwoFactor, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [USER_ID, '123456']);
      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.jsonPayload.data.backupCodes, ['code-1', 'code-2']);
    } finally {
      AuthService.verifyAndEnableTwoFactor = originalVerifyAndEnableTwoFactor;
    }
  });

  it('DisableTwoFactor should require password', async () => {
    const req = { user: { id: USER_ID }, body: {} };
    const res = createMockResponse();

    const error = await runMiddleware(AuthController.DisableTwoFactor, req, res);

    assert.equal(error.statusCode, 400);
  });

  it('DisableTwoFactor should call service with current user', async () => {
    const originalDisableTwoFactor = AuthService.disableTwoFactor;
    let receivedArgs;

    AuthService.disableTwoFactor = async (...args) => {
      receivedArgs = args;
    };

    try {
      const req = { user: { id: USER_ID }, body: { password: 'StrongPass1' } };
      const res = createMockResponse();

      const error = await runMiddleware(AuthController.DisableTwoFactor, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [USER_ID, 'StrongPass1']);
      assert.equal(res.statusCode, 200);
    } finally {
      AuthService.disableTwoFactor = originalDisableTwoFactor;
    }
  });

  it('GetActiveSessions should pass refresh token fallback and return sessions', async () => {
    const originalGetActiveSessions = AuthService.getActiveSessions;
    let receivedArgs;

    AuthService.getActiveSessions = async (...args) => {
      receivedArgs = args;
      return [{ id: 'session-1' }];
    };

    try {
      const req = {
        user: { id: USER_ID },
        cookies: {},
        body: { refreshToken: 'refresh-body' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(AuthController.GetActiveSessions, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [USER_ID, 'refresh-body']);
      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.jsonPayload.data.sessions, [{ id: 'session-1' }]);
    } finally {
      AuthService.getActiveSessions = originalGetActiveSessions;
    }
  });

  it('RevokeSession should require sessionId', async () => {
    const req = { user: { id: USER_ID }, params: {} };
    const res = createMockResponse();

    const error = await runMiddleware(AuthController.RevokeSession, req, res);

    assert.equal(error.statusCode, 400);
  });

  it('RevokeSession should call service and return success', async () => {
    const originalRevokeSession = AuthService.revokeSession;
    let receivedArgs;

    AuthService.revokeSession = async (...args) => {
      receivedArgs = args;
    };

    try {
      const req = {
        user: { id: USER_ID },
        params: { sessionId: 'session-123' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(AuthController.RevokeSession, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [USER_ID, 'session-123']);
      assert.equal(res.statusCode, 200);
    } finally {
      AuthService.revokeSession = originalRevokeSession;
    }
  });

  it('GoogleAuth should require credential', async () => {
    const req = { body: {} };
    const res = createMockResponse();

    const error = await runMiddleware(AuthController.GoogleAuth, req, res);

    assert.equal(error.statusCode, 400);
  });

  it('GoogleAuth should verify token, call service and set cookies', async () => {
    const { OAuth2Client } = await import('google-auth-library');
    const originalVerifyIdToken = OAuth2Client.prototype.verifyIdToken;
    const originalGoogleAuth = AuthService.googleAuth;
    let receivedProfile;

    OAuth2Client.prototype.verifyIdToken = async () => ({
      getPayload: () => ({
        sub: 'google-sub-1',
        email: 'user@example.com',
        name: 'Google User',
      }),
    });

    AuthService.googleAuth = async profile => {
      receivedProfile = profile;
      return {
        user: { id: USER_ID, email: profile.email },
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token',
      };
    };

    try {
      const req = { body: { credential: 'google-credential' } };
      const res = createMockResponse();

      const error = await runMiddleware(AuthController.GoogleAuth, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedProfile.email, 'user@example.com');
      assert.equal(res.statusCode, 200);
      assert.ok(res.cookies.some(cookie => cookie.name === 'accessToken'));
      assert.ok(res.cookies.some(cookie => cookie.name === 'refreshToken'));
    } finally {
      OAuth2Client.prototype.verifyIdToken = originalVerifyIdToken;
      AuthService.googleAuth = originalGoogleAuth;
    }
  });
});

