import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import authRouter from '../../../src/routes/auth.router.js';
import userRouter from '../../../src/routes/user.router.js';
import postRouter from '../../../src/routes/post.router.js';
import commentRouter from '../../../src/routes/comment.router.js';
import likeRouter from '../../../src/routes/like.router.js';
import savePostRouter from '../../../src/routes/savepost.router.js';
import messageRouter from '../../../src/routes/message.router.js';
import notificationRouter from '../../../src/routes/notification.router.js';
import reportRouter from '../../../src/routes/reports.router.js';
import userSettingsRouter from '../../../src/routes/userSettings.router.js';
import adminRouter from '../../../src/routes/admin.router.js';
import {
  createRouterTestApp,
  requestJson,
  startTestServer,
  stopTestServer,
} from '../../shared/httpTestUtils.js';
import {
  TEST_ADMIN_ID,
  TEST_USER_ID,
  createAccessToken,
  mockUserLookup,
} from '../../shared/authTestUtils.js';

const OBJECT_ID = '507f191e810c19729de860ea';

const protectedRoutes = [
  { name: 'auth-logout', router: authRouter, method: 'POST', path: '/logout' },
  { name: 'auth-me', router: authRouter, method: 'GET', path: '/me' },
  { name: 'user-search', router: userRouter, method: 'GET', path: '/search?q=abc' },
  { name: 'post-feed', router: postRouter, method: 'GET', path: '/?page=1&limit=2' },
  { name: 'comment-list', router: commentRouter, method: 'GET', path: `/post/${OBJECT_ID}` },
  { name: 'like-list', router: likeRouter, method: 'GET', path: '/my-likes' },
  { name: 'savepost-list', router: savePostRouter, method: 'GET', path: '/' },
  { name: 'message-list', router: messageRouter, method: 'GET', path: '/conversations' },
  { name: 'notification-list', router: notificationRouter, method: 'GET', path: '/' },
  { name: 'report-list', router: reportRouter, method: 'GET', path: '/my-reports' },
  { name: 'settings', router: userSettingsRouter, method: 'GET', path: '/' },
  { name: 'admin-health', router: adminRouter, method: 'GET', path: '/health' },
];

describe('module authorization integration', () => {
  let restoreUserLookup;

  before(() => {
    restoreUserLookup = mockUserLookup({
      [TEST_USER_ID]: {
        _id: TEST_USER_ID,
        isAdmin: false,
        isActive: true,
        moderation: { status: 'active' },
      },
      [TEST_ADMIN_ID]: {
        _id: TEST_ADMIN_ID,
        isAdmin: true,
        isActive: true,
        moderation: { status: 'active' },
      },
    });
  });

  after(() => {
    if (restoreUserLookup) restoreUserLookup();
  });

  for (const testCase of protectedRoutes) {
    it(`${testCase.name} should return 401 when token is missing`, async () => {
      const app = createRouterTestApp(testCase.router);
      const server = await startTestServer(app);

      try {
        const response = await requestJson(server, {
          method: testCase.method,
          path: testCase.path,
        });

        assert.equal(response.status, 401);
        assert.equal(response.body?.errorCode, 'AUTH_REQUIRED');
      } finally {
        await stopTestServer(server);
      }
    });
  }

  it('protected route should return TOKEN_INVALID for malformed token', async () => {
    const app = createRouterTestApp(userRouter);
    const server = await startTestServer(app);

    try {
      const response = await requestJson(server, {
        method: 'GET',
        path: '/search?q=abc',
        headers: {
          authorization: 'Bearer this-is-not-a-jwt',
        },
      });

      assert.equal(response.status, 401);
      assert.equal(response.body?.errorCode, 'TOKEN_INVALID');
    } finally {
      await stopTestServer(server);
    }
  });

  it('admin route should return 403 for authenticated non-admin user', async () => {
    const app = createRouterTestApp(adminRouter);
    const server = await startTestServer(app);

    try {
      const response = await requestJson(server, {
        method: 'GET',
        path: '/health',
        headers: {
          authorization: `Bearer ${createAccessToken({ id: TEST_USER_ID })}`,
        },
      });

      assert.equal(response.status, 403);
      assert.equal(response.body?.message, 'Forbidden. Admin privileges required.');
    } finally {
      await stopTestServer(server);
    }
  });
});

