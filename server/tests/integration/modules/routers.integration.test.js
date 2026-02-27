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
  createAccessToken,
  TEST_ADMIN_ID,
  TEST_USER_ID,
  mockUserLookup,
} from '../../shared/authTestUtils.js';

const routerCases = [
  {
    name: 'auth',
    router: authRouter,
    method: 'POST',
    path: '/register',
    body: {},
  },
  {
    name: 'user',
    router: userRouter,
    method: 'POST',
    path: '/follow',
    body: { targetUserId: 'bad-id' },
    auth: 'user',
  },
  {
    name: 'post',
    router: postRouter,
    method: 'GET',
    path: '/bad-id',
    auth: 'user',
  },
  {
    name: 'comment',
    router: commentRouter,
    method: 'GET',
    path: '/post/bad-id',
    auth: 'user',
  },
  {
    name: 'like',
    router: likeRouter,
    method: 'GET',
    path: '/status/bad-id',
    auth: 'user',
  },
  {
    name: 'savepost',
    router: savePostRouter,
    method: 'GET',
    path: '/bad-id/status',
    auth: 'user',
  },
  {
    name: 'message',
    router: messageRouter,
    method: 'POST',
    path: '/conversations',
    body: {},
    auth: 'user',
  },
  {
    name: 'notification',
    router: notificationRouter,
    method: 'POST',
    path: '/',
    body: { type: 'invalid' },
    auth: 'user',
  },
  {
    name: 'report',
    router: reportRouter,
    method: 'POST',
    path: '/post/bad-id',
    body: { reason: 'Spam content' },
    auth: 'user',
  },
  {
    name: 'userSettings',
    router: userSettingsRouter,
    method: 'PUT',
    path: '/privacy',
    body: {},
    auth: 'user',
  },
  {
    name: 'admin',
    router: adminRouter,
    method: 'POST',
    path: '/users/ban',
    body: {},
    auth: 'admin',
  },
];

describe('module router integration', () => {
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

  for (const testCase of routerCases) {
    it(`${testCase.name} router should return 400 for invalid request payload`, async () => {
      const app = createRouterTestApp(testCase.router);
      const server = await startTestServer(app);

      try {
        const headers = {};

        if (testCase.auth === 'user') {
          headers.authorization = `Bearer ${createAccessToken({ id: TEST_USER_ID })}`;
        }

        if (testCase.auth === 'admin') {
          headers.authorization = `Bearer ${createAccessToken({ id: TEST_ADMIN_ID })}`;
        }

        const response = await requestJson(server, {
          method: testCase.method,
          path: testCase.path,
          headers,
          body: testCase.body,
        });

        assert.equal(response.status, 400);
        assert.equal(response.body?.errorCode, 'VALIDATION_ERROR');
      } finally {
        await stopTestServer(server);
      }
    });
  }
});

