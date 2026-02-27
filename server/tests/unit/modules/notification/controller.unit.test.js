import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import NotificationController from '../../../../src/modules/notification/notification.controller.js';
import NotificationService from '../../../../src/modules/notification/notification.service.js';
import {
  createMockResponse,
  runMiddleware,
} from '../../../shared/middlewareTestUtils.js';

describe('NotificationController', () => {
  const USER_ID = '507f191e810c19729de860ea';

  it('createNotification should map legacy payload fields before calling service', async () => {
    const originalCreateNotification = NotificationService.createNotification;
    let receivedPayload;

    NotificationService.createNotification = async payload => {
      receivedPayload = payload;
      return { id: '507f191e810c19729de860ec', ...payload };
    };

    try {
      const req = {
        body: {
          userId: '507f191e810c19729de860ea',
          type: 'system',
          message: 'hello',
          title: 'System title',
          data: { postId: '507f191e810c19729de860eb' },
        },
        user: { id: '507f191e810c19729de860ed', isAdmin: false },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        NotificationController.createNotification,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.equal(receivedPayload.recipient, '507f191e810c19729de860ea');
      assert.equal(receivedPayload.sender, '507f191e810c19729de860ed');
      assert.equal(receivedPayload.content, 'hello');
      assert.equal(receivedPayload.relatedPost, '507f191e810c19729de860eb');
      assert.equal(receivedPayload.metadata.title, 'System title');
      assert.equal(res.statusCode, 201);
    } finally {
      NotificationService.createNotification = originalCreateNotification;
    }
  });

  it('createNotification should allow admin-provided sender and metadata merge', async () => {
    const originalCreateNotification = NotificationService.createNotification;
    let receivedPayload;

    NotificationService.createNotification = async payload => {
      receivedPayload = payload;
      return { id: '507f191e810c19729de860ff' };
    };

    try {
      const req = {
        body: {
          recipient: USER_ID,
          sender: '507f191e810c19729de860eb',
          type: 'system',
          content: 'maintenance',
          title: 'System',
          metadata: { foo: 'bar' },
        },
        user: { id: '507f191e810c19729de860ec', isAdmin: true },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        NotificationController.createNotification,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.equal(receivedPayload.sender, '507f191e810c19729de860eb');
      assert.equal(receivedPayload.metadata.title, 'System');
      assert.equal(receivedPayload.metadata.foo, 'bar');
      assert.equal(res.statusCode, 201);
    } finally {
      NotificationService.createNotification = originalCreateNotification;
    }
  });

  it('createNotification should return bad request for invalid payload', async () => {
    const req = {
      body: { type: 'system' },
      user: { id: USER_ID, isAdmin: false },
    };
    const res = createMockResponse();

    const error = await runMiddleware(
      NotificationController.createNotification,
      req,
      res
    );

    assert.equal(error.statusCode, 400);
  });

  it('getNotifications should convert unreadOnly to boolean and pass pagination', async () => {
    const originalGetNotifications = NotificationService.getNotifications;
    let receivedArgs;

    NotificationService.getNotifications = async (...args) => {
      receivedArgs = args;
      return {
        notifications: [],
        total: 0,
        unreadCount: 0,
        hasMore: false,
      };
    };

    try {
      const req = {
        user: { id: '507f191e810c19729de860ea' },
        query: { page: '2', limit: '5', unreadOnly: 'true' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        NotificationController.getNotifications,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.equal(receivedArgs[0], '507f191e810c19729de860ea');
      assert.equal(receivedArgs[1].page, 2);
      assert.equal(receivedArgs[1].limit, 5);
      assert.equal(receivedArgs[1].unreadOnly, true);
      assert.equal(res.statusCode, 200);
    } finally {
      NotificationService.getNotifications = originalGetNotifications;
    }
  });

  it('getNotificationById should return not found when missing', async () => {
    const originalGetNotificationById = NotificationService.getNotificationById;

    NotificationService.getNotificationById = async () => null;

    try {
      const req = {
        params: { notificationId: '507f191e810c19729de860ed' },
        user: { id: USER_ID },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        NotificationController.getNotificationById,
        req,
        res
      );

      assert.equal(error.statusCode, 404);
    } finally {
      NotificationService.getNotificationById = originalGetNotificationById;
    }
  });

  it('getNotificationById should return notification data when found', async () => {
    const originalGetNotificationById = NotificationService.getNotificationById;
    let receivedArgs;

    NotificationService.getNotificationById = async (...args) => {
      receivedArgs = args;
      return { id: args[0], content: 'hello' };
    };

    try {
      const req = {
        params: { notificationId: '507f191e810c19729de860ef' },
        user: { id: USER_ID },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        NotificationController.getNotificationById,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, ['507f191e810c19729de860ef', USER_ID]);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.data.id, '507f191e810c19729de860ef');
    } finally {
      NotificationService.getNotificationById = originalGetNotificationById;
    }
  });

  it('markAsRead should return not found when service returns null', async () => {
    const originalMarkAsRead = NotificationService.markAsRead;

    NotificationService.markAsRead = async () => null;

    try {
      const req = {
        params: { notificationId: '507f191e810c19729de860fa' },
        user: { id: USER_ID },
      };
      const res = createMockResponse();

      const error = await runMiddleware(NotificationController.markAsRead, req, res);

      assert.equal(error.statusCode, 404);
    } finally {
      NotificationService.markAsRead = originalMarkAsRead;
    }
  });

  it('markAsRead should return updated notification', async () => {
    const originalMarkAsRead = NotificationService.markAsRead;
    let receivedArgs;

    NotificationService.markAsRead = async (...args) => {
      receivedArgs = args;
      return { id: args[0], read: true };
    };

    try {
      const req = {
        params: { notificationId: '507f191e810c19729de860fb' },
        user: { id: USER_ID },
      };
      const res = createMockResponse();

      const error = await runMiddleware(NotificationController.markAsRead, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, ['507f191e810c19729de860fb', USER_ID]);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.data.read, true);
    } finally {
      NotificationService.markAsRead = originalMarkAsRead;
    }
  });

  it('deleteNotification should return not found when service reports missing notification', async () => {
    const originalDeleteNotification = NotificationService.deleteNotification;

    NotificationService.deleteNotification = async () => ({ success: false });

    try {
      const req = {
        params: { notificationId: '507f191e810c19729de860ea' },
        user: { id: '507f191e810c19729de860eb' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        NotificationController.deleteNotification,
        req,
        res
      );

      assert.equal(error.statusCode, 404);
    } finally {
      NotificationService.deleteNotification = originalDeleteNotification;
    }
  });

  it('deleteNotification should return success when service deletes notification', async () => {
    const originalDeleteNotification = NotificationService.deleteNotification;
    let receivedArgs;

    NotificationService.deleteNotification = async (...args) => {
      receivedArgs = args;
      return { success: true };
    };

    try {
      const req = {
        params: { notificationId: '507f191e810c19729de860fc' },
        user: { id: USER_ID },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        NotificationController.deleteNotification,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, ['507f191e810c19729de860fc', USER_ID]);
      assert.equal(res.statusCode, 200);
    } finally {
      NotificationService.deleteNotification = originalDeleteNotification;
    }
  });

  it('markAllAsRead should pass optional type from request body', async () => {
    const originalMarkAllAsRead = NotificationService.markAllAsRead;
    let receivedArgs;

    NotificationService.markAllAsRead = async (...args) => {
      receivedArgs = args;
      return { modifiedCount: 4 };
    };

    try {
      const req = {
        user: { id: '507f191e810c19729de860ea' },
        body: { type: 'comment' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        NotificationController.markAllAsRead,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, ['507f191e810c19729de860ea', 'comment']);
      assert.equal(res.statusCode, 200);
    } finally {
      NotificationService.markAllAsRead = originalMarkAllAsRead;
    }
  });

  it('deleteAllNotifications should delegate with optional type', async () => {
    const originalDeleteAllNotifications = NotificationService.deleteAllNotifications;
    let receivedArgs;

    NotificationService.deleteAllNotifications = async (...args) => {
      receivedArgs = args;
      return { deletedCount: 2 };
    };

    try {
      const req = {
        user: { id: USER_ID },
        body: { type: 'comment' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        NotificationController.deleteAllNotifications,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [USER_ID, 'comment']);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.data.deletedCount, 2);
    } finally {
      NotificationService.deleteAllNotifications = originalDeleteAllNotifications;
    }
  });

  it('getUnreadCount and getUnreadCountByType should return service data', async () => {
    const originalGetUnreadCount = NotificationService.getUnreadCount;
    const originalGetUnreadCountByType = NotificationService.getUnreadCountByType;

    NotificationService.getUnreadCount = async () => 7;
    NotificationService.getUnreadCountByType = async () => ({ like: 3, comment: 4 });

    try {
      {
        const req = { user: { id: USER_ID } };
        const res = createMockResponse();
        const error = await runMiddleware(
          NotificationController.getUnreadCount,
          req,
          res
        );
        assert.equal(error, undefined);
        assert.equal(res.statusCode, 200);
        assert.equal(res.jsonPayload.data.unreadCount, 7);
      }

      {
        const req = { user: { id: USER_ID } };
        const res = createMockResponse();
        const error = await runMiddleware(
          NotificationController.getUnreadCountByType,
          req,
          res
        );
        assert.equal(error, undefined);
        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.jsonPayload.data, { like: 3, comment: 4 });
      }
    } finally {
      NotificationService.getUnreadCount = originalGetUnreadCount;
      NotificationService.getUnreadCountByType = originalGetUnreadCountByType;
    }
  });

  it('getNotificationPreferences and updateNotificationPreferences should delegate to service', async () => {
    const originalGetNotificationPreferences =
      NotificationService.getNotificationPreferences;
    const originalUpdateNotificationPreferences =
      NotificationService.updateNotificationPreferences;
    let updateArgs;

    NotificationService.getNotificationPreferences = async () => ({
      push: { likes: true },
    });
    NotificationService.updateNotificationPreferences = async (...args) => {
      updateArgs = args;
      return { push: { likes: false } };
    };

    try {
      {
        const req = { user: { id: USER_ID } };
        const res = createMockResponse();
        const error = await runMiddleware(
          NotificationController.getNotificationPreferences,
          req,
          res
        );
        assert.equal(error, undefined);
        assert.equal(res.statusCode, 200);
        assert.equal(res.jsonPayload.data.push.likes, true);
      }

      {
        const req = {
          user: { id: USER_ID },
          body: { push: { likes: false } },
        };
        const res = createMockResponse();
        const error = await runMiddleware(
          NotificationController.updateNotificationPreferences,
          req,
          res
        );
        assert.equal(error, undefined);
        assert.deepEqual(updateArgs, [USER_ID, { push: { likes: false } }]);
        assert.equal(res.statusCode, 200);
        assert.equal(res.jsonPayload.data.push.likes, false);
      }
    } finally {
      NotificationService.getNotificationPreferences =
        originalGetNotificationPreferences;
      NotificationService.updateNotificationPreferences =
        originalUpdateNotificationPreferences;
    }
  });
});

