import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import AuthService from '../../../../src/modules/auth/auth.service.js';
import authRepository from '../../../../src/modules/auth/auth.repository.js';
import { hashRefreshToken } from '../../../../src/utils/refreshTokenHash.js';
import EmailService from '../../../../src/modules/shared/email/email.service.js';
import { hashPassword } from '../../../../src/utils/HashPassword.js';
import speakeasy from 'speakeasy';

const USER_ID = '507f191e810c19729de860ea';
const originalRepositoryMethods = { ...authRepository };
const originalCreateRefreshToken = AuthService._createRefreshToken;
const originalHandleFailedLogin = AuthService._handleFailedLogin;
const originalResetLoginAttempts = AuthService._resetLoginAttempts;
const originalVerifyTwoFactorToken = AuthService.verifyTwoFactorToken;
const originalSendPasswordReset = EmailService.sendPasswordReset;

afterEach(() => {
  Object.assign(authRepository, originalRepositoryMethods);
  AuthService._createRefreshToken = originalCreateRefreshToken;
  AuthService._handleFailedLogin = originalHandleFailedLogin;
  AuthService._resetLoginAttempts = originalResetLoginAttempts;
  AuthService.verifyTwoFactorToken = originalVerifyTwoFactorToken;
  EmailService.sendPasswordReset = originalSendPasswordReset;
});

describe('AuthService', () => {
  it('register should reject duplicate email and duplicate username', async () => {
    authRepository.userFindOne = async () => ({
      email: 'taken@example.com',
      username: 'someone',
    });

    await assert.rejects(
      AuthService.register({
        email: 'taken@example.com',
        username: 'new-user',
        password: 'Secret123!',
        name: 'Taken Email',
      }),
      err => err?.statusCode === 409
    );

    authRepository.userFindOne = async () => ({
      email: 'other@example.com',
      username: 'duplicated',
    });

    await assert.rejects(
      AuthService.register({
        email: 'new@example.com',
        username: 'duplicated',
        password: 'Secret123!',
        name: 'Taken Username',
      }),
      err => err?.statusCode === 409
    );
  });

  it('register should create user, settings and return token pair', async () => {
    let createdUserPayload;
    let createdSettingsPayload;
    authRepository.userFindOne = async () => null;
    authRepository.userCreate = async payload => {
      createdUserPayload = payload;
      return {
        _id: USER_ID,
        ...payload,
        avatar: 'avatar.png',
        verified: false,
        isAdmin: false,
      };
    };
    authRepository.userSettingsCreate = async payload => {
      createdSettingsPayload = payload;
    };
    AuthService._createRefreshToken = async () => ({ token: 'refresh-register' });

    const result = await AuthService.register({
      email: 'USER@Example.com',
      username: 'MyUser',
      password: 'Secret123!',
      name: 'Register User',
    });

    assert.equal(createdUserPayload.email, 'user@example.com');
    assert.equal(createdUserPayload.username, 'myuser');
    assert.equal(createdSettingsPayload.user, USER_ID);
    assert.equal(result.refreshToken, 'refresh-register');
    assert.equal(typeof result.accessToken, 'string');
  });

  it('login should reject missing user, banned user and temporarily locked user', async () => {
    authRepository.userFindOne = () => ({
      select: async () => null,
    });
    await assert.rejects(
      AuthService.login({ email: 'missing@example.com', password: 'x' }),
      err => err?.statusCode === 401
    );

    const hashed = await hashPassword('password');
    authRepository.userFindOne = () => ({
      select: async () => ({
        _id: USER_ID,
        email: 'user@example.com',
        password: hashed,
        moderation: { status: 'banned' },
      }),
    });
    await assert.rejects(
      AuthService.login({ email: 'user@example.com', password: 'password' }),
      err => err?.statusCode === 403
    );

    authRepository.userFindOne = () => ({
      select: async () => ({
        _id: USER_ID,
        email: 'user@example.com',
        password: hashed,
        moderation: { status: 'active' },
        loginAttempts: { lockUntil: new Date(Date.now() + 5 * 60 * 1000) },
      }),
    });
    await assert.rejects(
      AuthService.login({ email: 'user@example.com', password: 'password' }),
      err => err?.statusCode === 403
    );
  });

  it('login should reject suspended user until suspension expires', async () => {
    const hashed = await hashPassword('password');
    authRepository.userFindOne = () => ({
      select: async () => ({
        _id: USER_ID,
        email: 'user@example.com',
        password: hashed,
        moderation: {
          status: 'suspended',
          suspendedUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
        loginAttempts: { count: 0 },
      }),
    });

    await assert.rejects(
      AuthService.login({ email: 'user@example.com', password: 'password' }),
      err => err?.statusCode === 403
    );
  });

  it('login should invoke failed-login handler for wrong password', async () => {
    const hashed = await hashPassword('correct-password');
    let failedHandlerCalled = false;
    AuthService._handleFailedLogin = async () => {
      failedHandlerCalled = true;
    };
    authRepository.userFindOne = () => ({
      select: async () => ({
        _id: USER_ID,
        email: 'user@example.com',
        password: hashed,
        moderation: { status: 'active' },
        loginAttempts: { count: 0 },
      }),
    });

    await assert.rejects(
      AuthService.login({ email: 'user@example.com', password: 'wrong-password' }),
      err => err?.statusCode === 401
    );
    assert.equal(failedHandlerCalled, true);
  });

  it('login should enforce 2FA when enabled (required and invalid token)', async () => {
    const hashed = await hashPassword('correct-password');
    authRepository.userFindOne = () => ({
      select: async () => ({
        _id: USER_ID,
        email: 'user@example.com',
        password: hashed,
        moderation: { status: 'active' },
        loginAttempts: { count: 0 },
      }),
    });
    authRepository.userSettingsFindOne = () => ({
      select: async () => ({
        security: { twoFactorEnabled: true },
      }),
    });

    await assert.rejects(
      AuthService.login({ email: 'user@example.com', password: 'correct-password' }),
      err => err?.statusCode === 401 && err?.errorCode === '2FA_REQUIRED'
    );

    AuthService.verifyTwoFactorToken = async () => false;
    await assert.rejects(
      AuthService.login({
        email: 'user@example.com',
        password: 'correct-password',
        twoFactorToken: '123456',
      }),
      err => err?.statusCode === 401 && err?.errorCode === '2FA_INVALID'
    );
  });

  it('login should clear expired suspension and return login payload on success', async () => {
    const hashed = await hashPassword('correct-password');
    const updateCalls = [];
    AuthService._createRefreshToken = async () => ({ token: 'refresh-login' });
    authRepository.userFindOne = () => ({
      select: async () => ({
        _id: USER_ID,
        name: 'Login User',
        email: 'user@example.com',
        username: 'login_user',
        avatar: 'avatar.png',
        verified: true,
        isAdmin: false,
        bio: 'bio',
        followersCount: 1,
        followingCount: 2,
        postsCount: 3,
        password: hashed,
        moderation: {
          status: 'suspended',
          suspendedUntil: new Date(Date.now() - 60 * 1000),
        },
        loginAttempts: { count: 1 },
      }),
    });
    authRepository.userSettingsFindOne = () => ({
      select: async () => ({
        security: { twoFactorEnabled: false },
      }),
    });
    authRepository.userFindByIdAndUpdate = async (...args) => {
      updateCalls.push(args);
    };

    const result = await AuthService.login(
      { email: 'USER@example.com', password: 'correct-password' },
      { ip: '1.1.1.1', platform: 'web', userAgent: 'UA' }
    );

    assert.equal(result.user._id, USER_ID);
    assert.equal(result.refreshToken, 'refresh-login');
    assert.equal(typeof result.accessToken, 'string');
    assert.equal(updateCalls.length >= 2, true);
  });

  it('getCurrentUser should throw when user is not found', async () => {
    authRepository.userFindById = () => ({
      select: async () => null,
    });

    await assert.rejects(
      AuthService.getCurrentUser(USER_ID),
      err => err?.statusCode === 404
    );
  });

  it('getCurrentUser should return a safe user payload', async () => {
    authRepository.userFindById = () => ({
      select: async () => ({
        _id: USER_ID,
        name: 'Auth User',
        email: 'user@example.com',
        username: 'auth_user',
        avatar: 'avatar.png',
        verified: true,
        isAdmin: false,
        bio: 'bio',
        followersCount: 10,
        followingCount: 5,
        postsCount: 7,
      }),
    });

    const result = await AuthService.getCurrentUser(USER_ID);

    assert.equal(result._id, USER_ID);
    assert.equal(result.username, 'auth_user');
    assert.equal(result.followersCount, 10);
  });

  it('_handleFailedLogin should increment numeric loginAttempts', async () => {
    const originalUpdate = authRepository.userFindByIdAndUpdate;
    let receivedUpdate;

    authRepository.userFindByIdAndUpdate = async (_id, update) => {
      receivedUpdate = update;
    };

    try {
      await AuthService._handleFailedLogin({
        _id: '507f191e810c19729de860ea',
        loginAttempts: 2,
      });

      assert.equal(receivedUpdate.$set.loginAttempts.count, 3);
      assert.equal(receivedUpdate.$set.loginAttempts.lockUntil, null);
    } finally {
      authRepository.userFindByIdAndUpdate = originalUpdate;
    }
  });

  it('_handleFailedLogin should set lockUntil when max attempts reached', async () => {
    const originalUpdate = authRepository.userFindByIdAndUpdate;
    let receivedUpdate;

    authRepository.userFindByIdAndUpdate = async (_id, update) => {
      receivedUpdate = update;
    };

    try {
      await AuthService._handleFailedLogin({
        _id: '507f191e810c19729de860ea',
        loginAttempts: { count: 4 },
      });

      assert.equal(receivedUpdate.$set['loginAttempts.count'], 5);
      assert.ok(receivedUpdate.$set['loginAttempts.lockUntil'] instanceof Date);
    } finally {
      authRepository.userFindByIdAndUpdate = originalUpdate;
    }
  });

  it('_handleFailedLogin should also lock legacy numeric format at max attempts', async () => {
    let receivedUpdate;
    authRepository.userFindByIdAndUpdate = async (_id, update) => {
      receivedUpdate = update;
    };

    await AuthService._handleFailedLogin({
      _id: USER_ID,
      loginAttempts: 4,
    });

    assert.equal(receivedUpdate.$set.loginAttempts.count, 5);
    assert.ok(receivedUpdate.$set.loginAttempts.lockUntil instanceof Date);
  });

  it('_resetLoginAttempts should reset both legacy numeric and object formats', async () => {
    const originalUpdate = authRepository.userFindByIdAndUpdate;
    const calls = [];

    authRepository.userFindByIdAndUpdate = async (...args) => {
      calls.push(args);
    };

    try {
      await AuthService._resetLoginAttempts({
        _id: '507f191e810c19729de860ea',
        loginAttempts: 2,
      });
      await AuthService._resetLoginAttempts({
        _id: '507f191e810c19729de860eb',
        loginAttempts: { count: 3 },
      });

      assert.equal(calls.length, 2);
      assert.equal(calls[0][1].$set.loginAttempts.count, 0);
      assert.equal(calls[1][1].$set['loginAttempts.count'], 0);
    } finally {
      authRepository.userFindByIdAndUpdate = originalUpdate;
    }
  });

  it('logout should return success when refresh token is missing', async () => {
    const result = await AuthService.logout(null);
    assert.deepEqual(result, { success: true });
  });

  it('logout should revoke matched hashed refresh token', async () => {
    const originalFindOne = authRepository.refreshTokenFindOne;
    const token = 'raw-refresh-token';
    const tokenHash = hashRefreshToken(token);
    let queries = [];
    let saved = false;

    authRepository.refreshTokenFindOne = async query => {
      queries.push(query);
      if (query.token === tokenHash) {
        return {
          token: tokenHash,
          isRevoked: false,
          revokedReason: null,
          save: async () => {
            saved = true;
          },
        };
      }
      return null;
    };

    try {
      await AuthService.logout(token);

      assert.equal(queries[0].token, tokenHash);
      assert.equal(saved, true);
    } finally {
      authRepository.refreshTokenFindOne = originalFindOne;
    }
  });

  it('logout should fallback to legacy plaintext token and migrate to hashed token', async () => {
    const originalFindOne = authRepository.refreshTokenFindOne;
    const token = 'legacy-raw-token';
    const tokenHash = hashRefreshToken(token);
    let callIndex = 0;
    let tokenDoc;

    authRepository.refreshTokenFindOne = async query => {
      callIndex += 1;
      if (callIndex === 1) return null;
      if (query.token === token) {
        tokenDoc = {
          token,
          isRevoked: false,
          revokedReason: null,
          save: async () => {},
        };
        return tokenDoc;
      }
      return null;
    };

    try {
      await AuthService.logout(token);

      assert.equal(tokenDoc.isRevoked, true);
      assert.equal(tokenDoc.revokedReason, 'logout');
      assert.equal(tokenDoc.token, tokenHash);
    } finally {
      authRepository.refreshTokenFindOne = originalFindOne;
    }
  });

  it('logoutAllDevices should revoke all active tokens for user', async () => {
    const originalUpdateMany = authRepository.refreshTokenUpdateMany;
    let receivedArgs;

    authRepository.refreshTokenUpdateMany = async (...args) => {
      receivedArgs = args;
    };

    try {
      const result = await AuthService.logoutAllDevices(
        '507f191e810c19729de860ea'
      );

      assert.equal(result.success, true);
      assert.deepEqual(receivedArgs[0], {
        user: '507f191e810c19729de860ea',
        isRevoked: false,
      });
      assert.deepEqual(receivedArgs[1], {
        isRevoked: true,
        revokedReason: 'logout_all',
      });
    } finally {
      authRepository.refreshTokenUpdateMany = originalUpdateMany;
    }
  });

  it('getActiveSessions should map session info and detect current token by raw or hash', async () => {
    const originalFind = authRepository.refreshTokenFind;
    const rawCurrent = 'current-token';
    const currentHash = hashRefreshToken(rawCurrent);
    let receivedQuery;

    authRepository.refreshTokenFind = query => {
      receivedQuery = query;
      return {
        select() {
          return this;
        },
        sort() {
          return this;
        },
        lean: async () => [
          {
            _id: 'session-1',
            token: rawCurrent,
            device: { ip: '127.0.0.1', browser: 'Chrome', os: 'Windows' },
            lastUsedAt: new Date(),
          },
          {
            _id: 'session-2',
            token: currentHash,
            device: { ip: '127.0.0.2' },
            lastUsedAt: new Date(Date.now() - 60 * 60 * 1000),
          },
          {
            _id: 'session-3',
            token: 'another-token',
            device: {},
            lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
        ],
      };
    };

    try {
      const sessions = await AuthService.getActiveSessions(
        '507f191e810c19729de860ea',
        rawCurrent
      );

      assert.deepEqual(receivedQuery, {
        user: '507f191e810c19729de860ea',
        isRevoked: false,
        expiresAt: { $gt: receivedQuery.expiresAt.$gt },
      });
      assert.equal(sessions.length, 3);
      assert.equal(sessions[0].isCurrent, true);
      assert.equal(sessions[1].isCurrent, true);
      assert.equal(sessions[2].isCurrent, false);
      assert.equal(sessions[2].browser, 'Unknown Browser');
      assert.equal(sessions[2].os, 'Unknown OS');
    } finally {
      authRepository.refreshTokenFind = originalFind;
    }
  });

  it('_createRefreshToken should persist hashed token and default unknown device fields', async () => {
    let createPayload;
    authRepository.refreshTokenCreate = async payload => {
      createPayload = payload;
      return { _id: 'refresh-doc-id' };
    };

    const result = await AuthService._createRefreshToken(USER_ID, {
      ip: '1.2.3.4',
    });

    assert.equal(result.id, 'refresh-doc-id');
    assert.equal(typeof result.token, 'string');
    assert.equal(result.token.length, 80);
    assert.equal(createPayload.user, USER_ID);
    assert.equal(createPayload.token, hashRefreshToken(result.token));
    assert.equal(createPayload.device.ip, '1.2.3.4');
    assert.equal(createPayload.device.userAgent, 'unknown');
    assert.equal(createPayload.device.platform, 'unknown');
  });

  it('refreshToken should revoke token family when reuse is detected', async () => {
    const rawToken = 'reuse-token';
    const tokenHash = hashRefreshToken(rawToken);
    let updateManyArgs;

    authRepository.refreshTokenFindOne = async query => {
      if (query.token === tokenHash && query.isRevoked === false) return null;
      if (query.token === rawToken && query.isRevoked === false) return null;
      if (query.token === tokenHash && query.isRevoked === undefined) {
        return { family: 'family-1', user: USER_ID };
      }
      return null;
    };
    authRepository.refreshTokenUpdateMany = async (...args) => {
      updateManyArgs = args;
    };

    await assert.rejects(
      AuthService.refreshToken(rawToken),
      err => err?.statusCode === 401
    );

    assert.deepEqual(updateManyArgs[0], { family: 'family-1' });
    assert.deepEqual(updateManyArgs[1], {
      isRevoked: true,
      revokedReason: 'token_reuse_detected',
    });
  });

  it('refreshToken should revoke and reject expired token', async () => {
    const rawToken = 'expired-token';
    const tokenHash = hashRefreshToken(rawToken);
    let saved = false;
    const refreshDoc = {
      user: USER_ID,
      token: tokenHash,
      isRevoked: false,
      revokedReason: null,
      expiresAt: new Date(Date.now() - 1000),
      save: async () => {
        saved = true;
      },
    };

    authRepository.refreshTokenFindOne = async query =>
      query.isRevoked === false ? refreshDoc : null;

    await assert.rejects(
      AuthService.refreshToken(rawToken),
      err => err?.statusCode === 401
    );
    assert.equal(refreshDoc.isRevoked, true);
    assert.equal(refreshDoc.revokedReason, 'expired');
    assert.equal(saved, true);
  });

  it('refreshToken should reject banned users', async () => {
    const rawToken = 'valid-refresh-token';
    const tokenHash = hashRefreshToken(rawToken);
    const refreshDoc = {
      user: USER_ID,
      token: tokenHash,
      family: 'family-2',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      save: async () => {},
      device: {},
    };

    authRepository.refreshTokenFindOne = async query =>
      query.isRevoked === false ? refreshDoc : null;
    authRepository.userFindById = async () => ({
      _id: USER_ID,
      moderation: { status: 'banned' },
    });

    await assert.rejects(
      AuthService.refreshToken(rawToken),
      err => err?.statusCode === 403
    );
  });

  it('refreshToken should rotate token for valid active session', async () => {
    const rawToken = 'active-refresh-token';
    const tokenHash = hashRefreshToken(rawToken);
    let saved = false;
    let createdPayload;
    const refreshDoc = {
      user: USER_ID,
      token: tokenHash,
      family: 'family-3',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      device: { userAgent: 'UA', ip: '10.0.0.1', platform: 'web' },
      save: async () => {
        saved = true;
      },
    };

    authRepository.refreshTokenFindOne = async query => {
      if (query.token === tokenHash && query.isRevoked === false) return refreshDoc;
      return null;
    };
    authRepository.userFindById = async () => ({
      _id: USER_ID,
      email: 'user@example.com',
      isAdmin: false,
    });
    authRepository.refreshTokenCreate = async payload => {
      createdPayload = payload;
      return { _id: 'new-refresh-doc' };
    };

    const result = await AuthService.refreshToken(rawToken, { ip: '20.0.0.1' });

    assert.equal(saved, true);
    assert.equal(refreshDoc.isRevoked, true);
    assert.equal(refreshDoc.revokedReason, 'rotated');
    assert.equal(createdPayload.family, 'family-3');
    assert.equal(createdPayload.device.userAgent, 'UA');
    assert.equal(createdPayload.device.ip, '20.0.0.1');
    assert.equal(typeof result.accessToken, 'string');
    assert.equal(typeof result.refreshToken, 'string');
    assert.notEqual(result.refreshToken, rawToken);
  });

  it('refreshToken should scrub legacy plaintext token when expired', async () => {
    const rawToken = 'legacy-expired-token';
    const rawTokenHash = hashRefreshToken(rawToken);
    const refreshDoc = {
      user: USER_ID,
      token: rawToken,
      isRevoked: false,
      revokedReason: null,
      expiresAt: new Date(Date.now() - 5 * 60 * 1000),
      save: async () => {},
    };

    authRepository.refreshTokenFindOne = async query => {
      if (query.token === rawTokenHash && query.isRevoked === false) return null;
      if (query.token === rawToken && query.isRevoked === false) return refreshDoc;
      return null;
    };

    await assert.rejects(
      AuthService.refreshToken(rawToken),
      err => err?.statusCode === 401
    );
    assert.equal(refreshDoc.token, rawTokenHash);
    assert.equal(refreshDoc.revokedReason, 'expired');
  });

  it('refreshToken should scrub legacy plaintext token when rotating valid token', async () => {
    const rawToken = 'legacy-rotate-token';
    const rawTokenHash = hashRefreshToken(rawToken);
    const refreshDoc = {
      user: USER_ID,
      token: rawToken,
      family: 'legacy-family',
      isRevoked: false,
      revokedReason: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      device: {},
      save: async () => {},
    };
    authRepository.refreshTokenFindOne = async query => {
      if (query.token === rawTokenHash && query.isRevoked === false) return null;
      if (query.token === rawToken && query.isRevoked === false) return refreshDoc;
      return null;
    };
    authRepository.userFindById = async () => ({
      _id: USER_ID,
      email: 'user@example.com',
      isAdmin: false,
    });
    authRepository.refreshTokenCreate = async () => ({ _id: 'new-doc' });

    const result = await AuthService.refreshToken(rawToken);

    assert.equal(refreshDoc.token, rawTokenHash);
    assert.equal(refreshDoc.revokedReason, 'rotated');
    assert.equal(typeof result.refreshToken, 'string');
  });

  it('changePassword should throw not found when user does not exist', async () => {
    authRepository.userFindById = () => ({
      select: async () => null,
    });

    await assert.rejects(
      AuthService.changePassword(USER_ID, 'old', 'new-password'),
      err => err?.statusCode === 404
    );
  });

  it('changePassword should throw when current password is incorrect', async () => {
    const hashed = await hashPassword('old-password');
    authRepository.userFindById = () => ({
      select: async () => ({
        _id: USER_ID,
        password: hashed,
        save: async () => {},
      }),
    });

    await assert.rejects(
      AuthService.changePassword(USER_ID, 'wrong-password', 'new-password'),
      err => err?.statusCode === 400
    );
  });

  it('changePassword should update password and revoke active sessions', async () => {
    const hashed = await hashPassword('old-password');
    let saveCalled = false;
    let updateManyArgs;
    const user = {
      _id: USER_ID,
      password: hashed,
      save: async () => {
        saveCalled = true;
      },
    };

    authRepository.userFindById = () => ({
      select: async () => user,
    });
    authRepository.refreshTokenUpdateMany = async (...args) => {
      updateManyArgs = args;
    };

    const result = await AuthService.changePassword(
      USER_ID,
      'old-password',
      'new-password'
    );

    assert.equal(result.success, true);
    assert.equal(saveCalled, true);
    assert.equal(updateManyArgs[1].revokedReason, 'password_changed');
  });

  it('changePassword should reject when new password is same as current password', async () => {
    const hashed = await hashPassword('same-password');
    authRepository.userFindById = () => ({
      select: async () => ({
        _id: USER_ID,
        password: hashed,
        save: async () => {},
      }),
    });

    await assert.rejects(
      AuthService.changePassword(USER_ID, 'same-password', 'same-password'),
      err => err?.statusCode === 400
    );
  });

  it('requestPasswordReset should return success for unknown email without sending email', async () => {
    let sendCalled = false;
    authRepository.userFindOne = async () => null;
    EmailService.sendPasswordReset = async () => {
      sendCalled = true;
      return true;
    };

    const result = await AuthService.requestPasswordReset('missing@example.com');
    assert.equal(result.success, true);
    assert.equal(sendCalled, false);
  });

  it('requestPasswordReset should persist reset token and call email service', async () => {
    let updateArgs;
    let emailArgs;
    authRepository.userFindOne = async () => ({
      _id: USER_ID,
      email: 'user@example.com',
    });
    authRepository.userFindByIdAndUpdate = async (...args) => {
      updateArgs = args;
    };
    EmailService.sendPasswordReset = async (...args) => {
      emailArgs = args;
      return true;
    };

    const result = await AuthService.requestPasswordReset('user@example.com');
    assert.equal(result.success, true);
    assert.equal(updateArgs[0], USER_ID);
    assert.equal(typeof updateArgs[1]['security.passwordResetToken'], 'string');
    assert.ok(updateArgs[1]['security.passwordResetExpires'] instanceof Date);
    assert.equal(emailArgs[0], 'user@example.com');
    assert.match(emailArgs[1], /reset-password\?token=/);
  });

  it('resetPassword should reject invalid or expired reset token', async () => {
    authRepository.userFindOne = async () => null;

    await assert.rejects(
      AuthService.resetPassword('invalid-token', 'new-password'),
      err => err?.statusCode === 400
    );
  });

  it('resetPassword should hash new password, clear reset fields and revoke sessions', async () => {
    let saved = false;
    let revokeArgs;
    const user = {
      _id: USER_ID,
      security: {
        passwordResetToken: 'old',
        passwordResetExpires: new Date(Date.now() + 1000),
      },
      save: async () => {
        saved = true;
      },
    };

    authRepository.userFindOne = async () => user;
    authRepository.refreshTokenUpdateMany = async (...args) => {
      revokeArgs = args;
    };

    const result = await AuthService.resetPassword('reset-token', 'new-password-2');
    assert.equal(result.success, true);
    assert.equal(saved, true);
    assert.equal(user.security.passwordResetToken, undefined);
    assert.equal(user.security.passwordResetExpires, undefined);
    assert.equal(revokeArgs[1].revokedReason, 'password_reset');
  });

  it('enableTwoFactor should persist secret and return QR code payload', async () => {
    let updateArgs;
    authRepository.userSettingsFindOneAndUpdate = async (...args) => {
      updateArgs = args;
    };

    const result = await AuthService.enableTwoFactor(USER_ID);

    assert.equal(typeof result.secret, 'string');
    assert.equal(result.qrCode.startsWith('data:image/png;base64,'), true);
    assert.equal(updateArgs[0].user, USER_ID);
    assert.equal(typeof updateArgs[1]['security.twoFactorSecret'], 'string');
    assert.equal(updateArgs[1]['security.twoFactorEnabled'], false);
  });

  it('verifyAndEnableTwoFactor should reject when setup is missing or token is invalid', async () => {
    authRepository.userSettingsFindOne = () => ({
      select: async () => null,
    });
    await assert.rejects(
      AuthService.verifyAndEnableTwoFactor(USER_ID, '000000'),
      err => err?.statusCode === 400
    );

    const secret = speakeasy.generateSecret({ length: 20 }).base32;
    authRepository.userSettingsFindOne = () => ({
      select: async () => ({
        security: { twoFactorSecret: secret },
      }),
    });
    await assert.rejects(
      AuthService.verifyAndEnableTwoFactor(USER_ID, '000000'),
      err => err?.statusCode === 400
    );
  });

  it('verifyAndEnableTwoFactor should enable 2FA and return backup codes', async () => {
    let updateArgs;
    const secret = speakeasy.generateSecret({ length: 20 }).base32;
    const validToken = speakeasy.totp({ secret, encoding: 'base32' });
    authRepository.userSettingsFindOne = () => ({
      select: async () => ({
        security: { twoFactorSecret: secret },
      }),
    });
    authRepository.userSettingsFindOneAndUpdate = async (...args) => {
      updateArgs = args;
    };

    const result = await AuthService.verifyAndEnableTwoFactor(USER_ID, validToken);

    assert.equal(result.success, true);
    assert.equal(result.backupCodes.length, 10);
    assert.equal(updateArgs[1]['security.twoFactorEnabled'], true);
    assert.equal(updateArgs[1]['security.twoFactorBackupCodes'].length, 10);
    assert.notEqual(
      updateArgs[1]['security.twoFactorBackupCodes'][0],
      result.backupCodes[0]
    );
  });

  it('disableTwoFactor should reject missing user or wrong password', async () => {
    authRepository.userFindById = () => ({
      select: async () => null,
    });
    await assert.rejects(
      AuthService.disableTwoFactor(USER_ID, 'password'),
      err => err?.statusCode === 404
    );

    const hashed = await hashPassword('correct-password');
    authRepository.userFindById = () => ({
      select: async () => ({ _id: USER_ID, password: hashed }),
    });
    await assert.rejects(
      AuthService.disableTwoFactor(USER_ID, 'wrong-password'),
      err => err?.statusCode === 400
    );
  });

  it('disableTwoFactor should clear 2FA settings for valid password', async () => {
    let updateArgs;
    const hashed = await hashPassword('correct-password');
    authRepository.userFindById = () => ({
      select: async () => ({ _id: USER_ID, password: hashed }),
    });
    authRepository.userSettingsFindOneAndUpdate = async (...args) => {
      updateArgs = args;
    };

    const result = await AuthService.disableTwoFactor(USER_ID, 'correct-password');

    assert.equal(result.success, true);
    assert.equal(updateArgs[1]['security.twoFactorEnabled'], false);
    assert.equal(updateArgs[1]['security.twoFactorSecret'], null);
  });

  it('verifyTwoFactorToken should reject when 2FA is not enabled', async () => {
    authRepository.userSettingsFindOne = () => ({
      select: async () => null,
    });

    await assert.rejects(
      AuthService.verifyTwoFactorToken(USER_ID, '000000'),
      err => err?.statusCode === 400
    );
  });

  it('verifyTwoFactorToken should return true/false for valid and invalid tokens', async () => {
    const secret = speakeasy.generateSecret({ length: 20 }).base32;
    const validToken = speakeasy.totp({ secret, encoding: 'base32' });
    authRepository.userSettingsFindOne = () => ({
      select: async () => ({
        security: { twoFactorSecret: secret },
      }),
    });

    const validResult = await AuthService.verifyTwoFactorToken(USER_ID, validToken);
    const invalidResult = await AuthService.verifyTwoFactorToken(USER_ID, '000000');

    assert.equal(validResult, true);
    assert.equal(invalidResult, false);
  });

  it('revokeSession should throw when session does not exist', async () => {
    authRepository.refreshTokenFindOneAndUpdate = async () => null;

    await assert.rejects(
      AuthService.revokeSession(USER_ID, 'missing-session'),
      err => err?.statusCode === 404
    );
  });

  it('revokeSession should return success when session is revoked', async () => {
    authRepository.refreshTokenFindOneAndUpdate = async () => ({ _id: 'session-1' });
    const result = await AuthService.revokeSession(USER_ID, 'session-1');
    assert.deepEqual(result, { success: true });
  });

  it('googleAuth should create user/settings for first-time login and return tokens', async () => {
    let settingsCreated = false;
    AuthService._createRefreshToken = async () => ({ token: 'refresh-google' });
    authRepository.userFindOne = async () => null;
    authRepository.userCreate = async () => ({
      _id: USER_ID,
      name: 'Google User',
      email: 'google@example.com',
      username: 'google_user',
      avatar: 'avatar',
      verified: true,
      isAdmin: false,
    });
    authRepository.userSettingsCreate = async () => {
      settingsCreated = true;
    };
    authRepository.userFindByIdAndUpdate = async () => ({});

    const result = await AuthService.googleAuth({
      email: 'google@example.com',
      name: 'Google User',
      picture: 'avatar',
      sub: 'google-sub',
    });

    assert.equal(settingsCreated, true);
    assert.equal(result.user.email, 'google@example.com');
    assert.equal(result.refreshToken, 'refresh-google');
  });

  it('googleAuth should reject banned account', async () => {
    authRepository.userFindOne = async () => ({
      _id: USER_ID,
      email: 'google@example.com',
      moderation: { status: 'banned' },
    });

    await assert.rejects(
      AuthService.googleAuth({
        email: 'google@example.com',
        name: 'Google User',
        picture: 'avatar',
        sub: 'google-sub',
      }),
      err => err?.statusCode === 403
    );
  });
});

