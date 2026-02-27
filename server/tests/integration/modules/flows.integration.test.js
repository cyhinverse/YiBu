import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import ApiError from '../../../src/helpers/ApiError.js';

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

import AuthService from '../../../src/modules/auth/auth.service.js';
import UserService from '../../../src/modules/user/user.service.js';
import PostService from '../../../src/modules/post/post.service.js';
import MessageService from '../../../src/modules/message/message.service.js';
import NotificationService from '../../../src/modules/notification/notification.service.js';
import ReportService from '../../../src/modules/report/report.service.js';
import AdminService from '../../../src/modules/admin/admin.service.js';

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

const buildHeaders = authRole => {
  if (authRole === 'none') return {};
  const id = authRole === 'admin' ? TEST_ADMIN_ID : TEST_USER_ID;

  return {
    authorization: `Bearer ${createAccessToken({ id })}`,
  };
};

const requestRouter = async ({
  router,
  method = 'GET',
  path = '/',
  body,
  authRole = 'user',
}) => {
  const app = createRouterTestApp(router);
  const server = await startTestServer(app);

  try {
    return await requestJson(server, {
      method,
      path,
      headers: buildHeaders(authRole),
      body,
    });
  } finally {
    await stopTestServer(server);
  }
};

const withPatchedMethod = async (object, methodName, implementation, run) => {
  const original = object[methodName];
  object[methodName] = implementation;

  try {
    await run();
  } finally {
    object[methodName] = original;
  }
};

describe('module flow integration', { concurrency: 1 }, () => {
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

  it('auth module should handle register success and service conflict', async () => {
    await withPatchedMethod(
      AuthService,
      'register',
      async input => ({
        user: {
          _id: TEST_USER_ID,
          email: input.email,
          username: input.username,
        },
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      }),
      async () => {
        const response = await requestRouter({
          router: authRouter,
          method: 'POST',
          path: '/register',
          authRole: 'none',
          body: {
            name: 'Cyhin',
            username: 'cyhin_dev',
            email: 'cyhin@example.com',
            password: 'StrongPass1',
          },
        });

        assert.equal(response.status, 201);
        assert.equal(response.body?.success, true);
        assert.equal(response.body?.data?._id, TEST_USER_ID);
      }
    );

    await withPatchedMethod(
      AuthService,
      'register',
      async () => {
        throw ApiError.conflict('Email exists', {
          errorCode: 'DUPLICATE_EMAIL',
        });
      },
      async () => {
        const response = await requestRouter({
          router: authRouter,
          method: 'POST',
          path: '/register',
          authRole: 'none',
          body: {
            name: 'Cyhin',
            username: 'cyhin_dev',
            email: 'cyhin@example.com',
            password: 'StrongPass1',
          },
        });

        assert.equal(response.status, 409);
        assert.equal(response.body?.success, false);
        assert.equal(response.body?.errorCode, 'DUPLICATE_EMAIL');
      }
    );
  });

  it('user module should handle search success and service failure', async () => {
    let receivedArgs;

    await withPatchedMethod(
      UserService,
      'searchUsers',
      async (...args) => {
        receivedArgs = args;
        return {
          users: [{ _id: OBJECT_ID, username: 'alice' }],
          total: 1,
          page: 1,
          limit: 5,
        };
      },
      async () => {
        const response = await requestRouter({
          router: userRouter,
          method: 'GET',
          path: '/search?q=alice&page=1&limit=5',
        });

        assert.equal(response.status, 200);
        assert.equal(response.body?.success, true);
        assert.equal(response.body?.data?.users?.length, 1);
        assert.deepEqual(receivedArgs, [
          'alice',
          TEST_USER_ID,
          { page: 1, limit: 5 },
        ]);
      }
    );

    await withPatchedMethod(
      UserService,
      'searchUsers',
      async () => {
        throw ApiError.internal('Search failed', {
          errorCode: 'SEARCH_ERROR',
        });
      },
      async () => {
        const response = await requestRouter({
          router: userRouter,
          method: 'GET',
          path: '/search?q=alice',
        });

        assert.equal(response.status, 500);
        assert.equal(response.body?.errorCode, 'SEARCH_ERROR');
      }
    );
  });

  it('post module should handle feed success and service failure', async () => {
    await withPatchedMethod(
      PostService,
      'getHomeFeed',
      async () => ({
        posts: [{ _id: OBJECT_ID, caption: 'hello' }],
        total: 1,
      }),
      async () => {
        const response = await requestRouter({
          router: postRouter,
          method: 'GET',
          path: '/?page=1&limit=2',
        });

        assert.equal(response.status, 200);
        assert.equal(response.body?.success, true);
        assert.equal(response.body?.data?.posts?.length, 1);
      }
    );

    await withPatchedMethod(
      PostService,
      'getHomeFeed',
      async () => {
        throw ApiError.forbidden('Feed not available', {
          errorCode: 'FEED_FORBIDDEN',
        });
      },
      async () => {
        const response = await requestRouter({
          router: postRouter,
          method: 'GET',
          path: '/?page=1&limit=2',
        });

        assert.equal(response.status, 403);
        assert.equal(response.body?.errorCode, 'FEED_FORBIDDEN');
      }
    );
  });

  it('comment module should handle list success and service failure', async () => {
    await withPatchedMethod(
      PostService,
      'getComments',
      async () => ({
        comments: [{ _id: OBJECT_ID, content: 'Nice post' }],
        total: 1,
      }),
      async () => {
        const response = await requestRouter({
          router: commentRouter,
          method: 'GET',
          path: `/post/${OBJECT_ID}?page=1&limit=5&sort=popular`,
        });

        assert.equal(response.status, 200);
        assert.equal(response.body?.success, true);
        assert.equal(response.body?.data?.comments?.length, 1);
      }
    );

    await withPatchedMethod(
      PostService,
      'getComments',
      async () => {
        throw ApiError.notFound('Post not found');
      },
      async () => {
        const response = await requestRouter({
          router: commentRouter,
          method: 'GET',
          path: `/post/${OBJECT_ID}`,
        });

        assert.equal(response.status, 404);
        assert.equal(response.body?.success, false);
      }
    );
  });

  it('like module should handle my-likes success and service failure', async () => {
    await withPatchedMethod(
      PostService,
      'getLikedPosts',
      async () => ({
        posts: [{ _id: OBJECT_ID }],
        total: 1,
      }),
      async () => {
        const response = await requestRouter({
          router: likeRouter,
          method: 'GET',
          path: '/my-likes?page=1&limit=10',
        });

        assert.equal(response.status, 200);
        assert.equal(response.body?.success, true);
        assert.equal(response.body?.data?.posts?.length, 1);
      }
    );

    await withPatchedMethod(
      PostService,
      'getLikedPosts',
      async () => {
        throw ApiError.internal('Cannot load likes');
      },
      async () => {
        const response = await requestRouter({
          router: likeRouter,
          method: 'GET',
          path: '/my-likes',
        });

        assert.equal(response.status, 500);
        assert.equal(response.body?.success, false);
      }
    );
  });

  it('savepost module should handle collections success and service failure', async () => {
    await withPatchedMethod(
      PostService,
      'getSavedCollections',
      async () => ['favorites', 'travel'],
      async () => {
        const response = await requestRouter({
          router: savePostRouter,
          method: 'GET',
          path: '/collections',
        });

        assert.equal(response.status, 200);
        assert.equal(response.body?.success, true);
        assert.deepEqual(response.body?.data, ['favorites', 'travel']);
      }
    );

    await withPatchedMethod(
      PostService,
      'getSavedCollections',
      async () => {
        throw ApiError.internal('Collections unavailable');
      },
      async () => {
        const response = await requestRouter({
          router: savePostRouter,
          method: 'GET',
          path: '/collections',
        });

        assert.equal(response.status, 500);
        assert.equal(response.body?.success, false);
      }
    );
  });

  it('message module should handle conversations success and service failure', async () => {
    await withPatchedMethod(
      MessageService,
      'getConversations',
      async () => ({
        conversations: [{ _id: OBJECT_ID, type: 'direct' }],
        total: 1,
      }),
      async () => {
        const response = await requestRouter({
          router: messageRouter,
          method: 'GET',
          path: '/conversations?page=1&limit=10',
        });

        assert.equal(response.status, 200);
        assert.equal(response.body?.success, true);
        assert.equal(response.body?.data?.conversations?.length, 1);
      }
    );

    await withPatchedMethod(
      MessageService,
      'getConversations',
      async () => {
        throw ApiError.forbidden('No access to conversations');
      },
      async () => {
        const response = await requestRouter({
          router: messageRouter,
          method: 'GET',
          path: '/conversations',
        });

        assert.equal(response.status, 403);
        assert.equal(response.body?.success, false);
      }
    );
  });

  it('notification module should handle list success and service failure', async () => {
    await withPatchedMethod(
      NotificationService,
      'getNotifications',
      async () => ({
        notifications: [{ _id: OBJECT_ID, type: 'system', content: 'Hi' }],
        total: 1,
        unreadCount: 1,
        hasMore: false,
      }),
      async () => {
        const response = await requestRouter({
          router: notificationRouter,
          method: 'GET',
          path: '/?page=1&limit=10',
        });

        assert.equal(response.status, 200);
        assert.equal(response.body?.success, true);
        assert.equal(response.body?.data?.notifications?.length, 1);
      }
    );

    await withPatchedMethod(
      NotificationService,
      'getNotifications',
      async () => {
        throw ApiError.internal('Notification service down');
      },
      async () => {
        const response = await requestRouter({
          router: notificationRouter,
          method: 'GET',
          path: '/',
        });

        assert.equal(response.status, 500);
        assert.equal(response.body?.success, false);
      }
    );
  });

  it('report module should handle my-reports success and service failure', async () => {
    await withPatchedMethod(
      ReportService,
      'getUserReports',
      async () => ({
        reports: [{ _id: OBJECT_ID, reason: 'Spam content' }],
        total: 1,
        hasMore: false,
      }),
      async () => {
        const response = await requestRouter({
          router: reportRouter,
          method: 'GET',
          path: '/my-reports?page=1&limit=10',
        });

        assert.equal(response.status, 200);
        assert.equal(response.body?.success, true);
        assert.equal(response.body?.data?.reports?.length, 1);
      }
    );

    await withPatchedMethod(
      ReportService,
      'getUserReports',
      async () => {
        throw ApiError.internal('Unable to fetch reports');
      },
      async () => {
        const response = await requestRouter({
          router: reportRouter,
          method: 'GET',
          path: '/my-reports',
        });

        assert.equal(response.status, 500);
        assert.equal(response.body?.success, false);
      }
    );
  });

  it('user settings module should handle get settings success and not-found', async () => {
    await withPatchedMethod(
      UserService,
      'getUserSettings',
      async () => ({
        privacy: { profileVisibility: 'public' },
        notifications: { likes: true },
      }),
      async () => {
        const response = await requestRouter({
          router: userSettingsRouter,
          method: 'GET',
          path: '/',
        });

        assert.equal(response.status, 200);
        assert.equal(response.body?.success, true);
        assert.equal(response.body?.data?.privacy?.profileVisibility, 'public');
      }
    );

    await withPatchedMethod(
      UserService,
      'getUserSettings',
      async () => {
        throw ApiError.notFound('Settings not found');
      },
      async () => {
        const response = await requestRouter({
          router: userSettingsRouter,
          method: 'GET',
          path: '/',
        });

        assert.equal(response.status, 404);
        assert.equal(response.body?.success, false);
      }
    );
  });

  it('admin module should handle users success and service failure', async () => {
    await withPatchedMethod(
      AdminService,
      'getAllUsers',
      async () => ({
        users: [{ _id: OBJECT_ID, email: 'user@example.com' }],
        total: 1,
        page: 1,
        totalPages: 1,
        hasMore: false,
      }),
      async () => {
        const response = await requestRouter({
          router: adminRouter,
          method: 'GET',
          path: '/users?page=1&limit=10',
          authRole: 'admin',
        });

        assert.equal(response.status, 200);
        assert.equal(response.body?.success, true);
        assert.equal(response.body?.data?.users?.length, 1);
      }
    );

    await withPatchedMethod(
      AdminService,
      'getAllUsers',
      async () => {
        throw ApiError.internal('Admin users unavailable');
      },
      async () => {
        const response = await requestRouter({
          router: adminRouter,
          method: 'GET',
          path: '/users',
          authRole: 'admin',
        });

        assert.equal(response.status, 500);
        assert.equal(response.body?.success, false);
      }
    );
  });
});

