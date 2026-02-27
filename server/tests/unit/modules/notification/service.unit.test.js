import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import NotificationService from '../../../../src/modules/notification/notification.service.js';
import notificationRepository from '../../../../src/modules/notification/notification.repository.js';
import socketService from '../../../../src/modules/shared/socket/socket.service.js';

const USER_ID = '507f191e810c19729de860ea';
const OTHER_ID = '507f191e810c19729de860eb';
const THIRD_ID = '507f191e810c19729de860ec';

const originalRepositoryMethods = { ...notificationRepository };
const originalSendNotification = socketService.sendNotification;

function makePopulateLeanChain(value) {
  return {
    populate() {
      return this;
    },
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    limit() {
      return this;
    },
    lean: async () => value,
  };
}

afterEach(() => {
  Object.assign(notificationRepository, originalRepositoryMethods);
  socketService.sendNotification = originalSendNotification;
});

describe('NotificationService', () => {
  it('_isNotificationEnabled should respect global and per-type settings', () => {
    assert.equal(
      NotificationService._isNotificationEnabled(
        { notifications: { push: { enabled: false } } },
        'like'
      ),
      false
    );
    assert.equal(
      NotificationService._isNotificationEnabled(
        { notifications: { push: { likes: false } } },
        'like'
      ),
      false
    );
    assert.equal(
      NotificationService._isNotificationEnabled(
        { notifications: { push: { likes: true } } },
        'like'
      ),
      true
    );
  });

  it('_isSenderBlockedOrMuted should detect blocked/muted sender ids', () => {
    assert.equal(
      NotificationService._isSenderBlockedOrMuted(
        { blockedUsers: [OTHER_ID], mutedUsers: [] },
        OTHER_ID
      ),
      true
    );
    assert.equal(
      NotificationService._isSenderBlockedOrMuted(
        { blockedUsers: [], mutedUsers: [OTHER_ID] },
        OTHER_ID
      ),
      true
    );
    assert.equal(
      NotificationService._isSenderBlockedOrMuted(
        { blockedUsers: [], mutedUsers: [] },
        OTHER_ID
      ),
      false
    );
  });

  it('_formatPreferences should provide defaults when setting is missing', () => {
    const result = NotificationService._formatPreferences({});
    assert.equal(result.likes, true);
    assert.equal(result.comments, true);
    assert.equal(result.email, true);
    assert.equal(result.push, true);
  });

  it('createNotification should return null for self-notification', async () => {
    const result = await NotificationService.createNotification({
      recipient: USER_ID,
      sender: USER_ID,
      type: 'like',
      content: 'x',
    });

    assert.equal(result, null);
  });

  it('createNotification should return null when sender is blocked', async () => {
    notificationRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({
          blockedUsers: [OTHER_ID],
          mutedUsers: [],
          notifications: { push: { likes: true } },
        }),
      }),
    });

    const result = await NotificationService.createNotification({
      recipient: USER_ID,
      sender: OTHER_ID,
      type: 'like',
      content: 'blocked',
    });

    assert.equal(result, null);
  });

  it('createNotification should update existing grouped notification when sender is new', async () => {
    notificationRepository.userSettingsFindOne = () => ({
      select: () => ({ lean: async () => ({ notifications: { push: {} } }) }),
    });
    notificationRepository.notificationFindOne = async () => ({
      _id: 'group-notification',
      groupedSenders: [{ user: THIRD_ID }],
      groupCount: 1,
    });
    notificationRepository.userFindById = () => ({
      select: () => ({
        lean: async () => ({ username: 'sender-a', avatar: 'avatar-a' }),
      }),
    });
    notificationRepository.notificationFindByIdAndUpdate = () =>
      makePopulateLeanChain({
        _id: 'group-notification',
        groupCount: 2,
        groupedSenders: [{ user: THIRD_ID }, { user: OTHER_ID }],
      });

    const result = await NotificationService.createNotification({
      recipient: USER_ID,
      sender: OTHER_ID,
      type: 'like',
      content: 'liked your post',
      groupKey: 'post:1:like',
    });

    assert.equal(result.groupCount, 2);
    assert.equal(result.groupedSenders.length, 2);
  });

  it('createNotification should return hydrated existing group when sender already exists', async () => {
    let updatedCalled = false;
    notificationRepository.userSettingsFindOne = () => ({
      select: () => ({ lean: async () => ({ notifications: { push: {} } }) }),
    });
    notificationRepository.notificationFindOne = async () => ({
      _id: 'group-notification',
      groupedSenders: [{ user: OTHER_ID }],
      groupCount: 2,
    });
    notificationRepository.notificationFindByIdAndUpdate = async () => {
      updatedCalled = true;
      return null;
    };
    notificationRepository.notificationFindById = () =>
      makePopulateLeanChain({
        _id: 'group-notification',
        groupCount: 2,
        content: 'old content',
      });

    const result = await NotificationService.createNotification({
      recipient: USER_ID,
      sender: OTHER_ID,
      type: 'follow',
      content: 'followed you',
      groupKey: 'user:1:follow',
    });

    assert.equal(updatedCalled, false);
    assert.equal(result._id, 'group-notification');
  });

  it('createNotification should create new notification and tolerate socket errors', async () => {
    notificationRepository.userSettingsFindOne = () => ({
      select: () => ({ lean: async () => ({ notifications: { push: {} } }) }),
    });
    notificationRepository.notificationFindOne = async () => null;
    notificationRepository.userFindById = () => ({
      select: () => ({
        lean: async () => ({ username: 'sender-a', avatar: 'avatar-a' }),
      }),
    });
    notificationRepository.notificationCreate = async () => ({ _id: 'notification-1' });
    notificationRepository.notificationFindById = () =>
      makePopulateLeanChain({
        _id: 'notification-1',
        content: 'new',
        sender: { _id: OTHER_ID, username: 'sender-a' },
      });
    socketService.sendNotification = async () => {
      throw new Error('socket unavailable');
    };

    const result = await NotificationService.createNotification({
      recipient: USER_ID,
      sender: OTHER_ID,
      type: 'comment',
      content: 'commented',
    });

    assert.equal(result._id, 'notification-1');
  });

  it('createNotification should send socket notification on successful create', async () => {
    let socketArgs;
    notificationRepository.userSettingsFindOne = () => ({
      select: () => ({ lean: async () => ({ notifications: { push: {} } }) }),
    });
    notificationRepository.notificationFindOne = async () => null;
    notificationRepository.userFindById = () => ({
      select: () => ({
        lean: async () => ({ username: 'sender-a', avatar: 'avatar-a' }),
      }),
    });
    notificationRepository.notificationCreate = async () => ({ _id: 'notification-2' });
    notificationRepository.notificationFindById = () =>
      makePopulateLeanChain({
        _id: 'notification-2',
        sender: { _id: OTHER_ID, username: 'sender-a' },
        relatedPost: { _id: 'post-1' },
        content: 'new',
      });
    socketService.sendNotification = async (...args) => {
      socketArgs = args;
    };

    const result = await NotificationService.createNotification({
      recipient: USER_ID,
      sender: OTHER_ID,
      type: 'like',
      content: 'liked',
      relatedPost: 'post-1',
    });

    assert.equal(result._id, 'notification-2');
    assert.equal(socketArgs[0], USER_ID);
    assert.equal(socketArgs[1]._id, 'notification-2');
  });

  it('getNotifications should apply filters and return formatted grouped notifications', async () => {
    let queryFromFind;
    let queryFromCount;
    let unreadQuery;

    notificationRepository.notificationFind = query => {
      queryFromFind = query;
      return makePopulateLeanChain([
        {
          _id: 'n1',
          type: 'like',
          content: 'raw',
          groupCount: 2,
          groupedSenders: [{ username: 'Alice' }],
          sender: { username: 'Alice' },
        },
      ]);
    };
    notificationRepository.notificationCountDocuments = async query => {
      if (query?.isRead === false && query?.recipient === USER_ID && !query.$or) {
        unreadQuery = query;
        return 4;
      }
      queryFromCount = query;
      return 8;
    };

    const result = await NotificationService.getNotifications(USER_ID, {
      page: 1,
      limit: 5,
      type: 'like',
      unreadOnly: true,
    });

    assert.equal(queryFromFind.type, 'like');
    assert.equal(queryFromFind.isRead, false);
    assert.equal(queryFromCount.type, 'like');
    assert.equal(unreadQuery.recipient, USER_ID);
    assert.equal(result.total, 8);
    assert.equal(result.unreadCount, 4);
    assert.equal(result.notifications[0].isGrouped, true);
    assert.match(result.notifications[0].displayContent, /Alice/);
  });

  it('getNotificationById should return null when notification does not exist', async () => {
    notificationRepository.notificationFindOne = () => makePopulateLeanChain(null);

    const result = await NotificationService.getNotificationById('missing', USER_ID);
    assert.equal(result, null);
  });

  it('getNotificationById should format notification when found', async () => {
    notificationRepository.notificationFindOne = () =>
      makePopulateLeanChain({
        _id: 'n2',
        content: 'raw',
        type: 'follow',
        groupCount: 2,
        groupedSenders: [{ username: 'Bob' }],
        sender: { username: 'Bob' },
      });

    const result = await NotificationService.getNotificationById('n2', USER_ID);
    assert.equal(result._id, 'n2');
    assert.equal(result.isGrouped, true);
  });

  it('markAsRead should update specific notification for user', async () => {
    let receivedArgs;
    notificationRepository.notificationFindOneAndUpdate = async (...args) => {
      receivedArgs = args;
      return { _id: 'n3', isRead: true };
    };

    const result = await NotificationService.markAsRead('n3', USER_ID);

    assert.equal(receivedArgs[0]._id, 'n3');
    assert.equal(receivedArgs[0].recipient, USER_ID);
    assert.equal(result.isRead, true);
  });

  it('markAllAsRead should return modified count and include type filter', async () => {
    const originalUpdateMany = notificationRepository.notificationUpdateMany;
    let receivedArgs;

    notificationRepository.notificationUpdateMany = async (...args) => {
      receivedArgs = args;
      return { modifiedCount: 3 };
    };

    try {
      const result = await NotificationService.markAllAsRead(USER_ID, 'comment');

      assert.equal(result.updatedCount, 3);
      assert.deepEqual(receivedArgs[0], {
        recipient: USER_ID,
        isRead: false,
        type: 'comment',
      });
    } finally {
      notificationRepository.notificationUpdateMany = originalUpdateMany;
    }
  });

  it('deleteNotification should return success true when notification exists', async () => {
    notificationRepository.notificationFindOneAndDelete = async () => ({ _id: 'n4' });

    const result = await NotificationService.deleteNotification('n4', USER_ID);
    assert.deepEqual(result, { success: true });
  });

  it('deleteNotification should return success false when notification does not exist', async () => {
    const originalFindOneAndDelete =
      notificationRepository.notificationFindOneAndDelete;
    notificationRepository.notificationFindOneAndDelete = async () => null;

    try {
      const result = await NotificationService.deleteNotification(USER_ID, OTHER_ID);
      assert.deepEqual(result, {
        success: false,
        error: 'Notification not found',
      });
    } finally {
      notificationRepository.notificationFindOneAndDelete = originalFindOneAndDelete;
    }
  });

  it('deleteAllNotifications should return deleted count and include optional type', async () => {
    let query;
    notificationRepository.notificationDeleteMany = async q => {
      query = q;
      return { deletedCount: 6 };
    };

    const result = await NotificationService.deleteAllNotifications(USER_ID, 'mention');
    assert.deepEqual(query, { recipient: USER_ID, type: 'mention' });
    assert.equal(result.deletedCount, 6);
  });

  it('getUnreadCount should count only unread and unexpired notifications', async () => {
    let query;
    notificationRepository.notificationCountDocuments = async q => {
      query = q;
      return 9;
    };

    const result = await NotificationService.getUnreadCount(USER_ID);
    assert.equal(query.recipient, USER_ID);
    assert.equal(query.isRead, false);
    assert.equal(Array.isArray(query.$or), true);
    assert.equal(result, 9);
  });

  it('getUnreadCountByType should map aggregate result to object', async () => {
    const originalAggregate = notificationRepository.notificationAggregate;
    notificationRepository.notificationAggregate = async () => [
      { _id: 'like', count: 2 },
      { _id: 'comment', count: 1 },
    ];

    try {
      const result = await NotificationService.getUnreadCountByType(USER_ID);

      assert.deepEqual(result, {
        like: 2,
        comment: 1,
      });
    } finally {
      notificationRepository.notificationAggregate = originalAggregate;
    }
  });

  it('updateNotificationPreferences should map push/email booleans', async () => {
    let updateDoc;
    notificationRepository.userSettingsFindOneAndUpdate = async (_query, update) => {
      updateDoc = update;
      return {
        notifications: {
          push: { enabled: false },
          email: { enabled: false },
        },
      };
    };

    const result = await NotificationService.updateNotificationPreferences(USER_ID, {
      push: false,
      email: false,
    });

    assert.equal(updateDoc.$set['notifications.push.enabled'], false);
    assert.equal(updateDoc.$set['notifications.email.enabled'], false);
    assert.equal(result.push, false);
    assert.equal(result.email, false);
  });

  it('updateNotificationPreferences should return current preferences when no fields provided', async () => {
    const originalFindOne = notificationRepository.userSettingsFindOne;
    notificationRepository.userSettingsFindOne = () => ({
      lean: async () => ({
        notifications: {
          push: {
            likes: false,
            comments: true,
          },
        },
      }),
    });

    try {
      const result = await NotificationService.updateNotificationPreferences(
        USER_ID,
        {}
      );

      assert.equal(result.likes, false);
      assert.equal(result.comments, true);
    } finally {
      notificationRepository.userSettingsFindOne = originalFindOne;
    }
  });

  it('updateNotificationPreferences should map legacy keys to nested push/email fields', async () => {
    const originalFindOneAndUpdate =
      notificationRepository.userSettingsFindOneAndUpdate;
    let receivedUpdate;

    notificationRepository.userSettingsFindOneAndUpdate = async (_query, update) => {
      receivedUpdate = update;
      return {
        toObject: () => ({
          notifications: {
            push: {
              enabled: false,
              likes: false,
              comments: false,
              mentions: true,
              sound: false,
            },
            email: {
              enabled: false,
              digest: 'daily',
            },
          },
        }),
      };
    };

    try {
      const result = await NotificationService.updateNotificationPreferences(
        USER_ID,
        {
          likes: false,
          replies: false,
          sound: false,
          email: {
            enabled: false,
            digest: 'daily',
          },
          push: {
            enabled: false,
            mentions: true,
          },
        }
      );

      assert.equal(receivedUpdate.$set['notifications.push.likes'], false);
      assert.equal(receivedUpdate.$set['notifications.push.comments'], false);
      assert.equal(receivedUpdate.$set['notifications.push.sound'], false);
      assert.equal(receivedUpdate.$set['notifications.email.enabled'], false);
      assert.equal(receivedUpdate.$set['notifications.email.digest'], 'daily');
      assert.equal(receivedUpdate.$set['notifications.push.enabled'], false);
      assert.equal(receivedUpdate.$set['notifications.push.mentions'], true);
      assert.equal(result.likes, false);
      assert.equal(result.comments, false);
      assert.equal(result.push, false);
      assert.equal(result.email, false);
    } finally {
      notificationRepository.userSettingsFindOneAndUpdate = originalFindOneAndUpdate;
    }
  });

  it('getNotificationPreferences should return formatted preferences from settings', async () => {
    notificationRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({
          notifications: {
            push: { likes: false, comments: true, enabled: true },
            email: { enabled: false },
          },
        }),
      }),
    });

    const result = await NotificationService.getNotificationPreferences(USER_ID);
    assert.equal(result.likes, false);
    assert.equal(result.comments, true);
    assert.equal(result.push, true);
    assert.equal(result.email, false);
  });
});

