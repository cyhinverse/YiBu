import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import Message from '../../../src/models/Message.js';
import Notification from '../../../src/models/Notification.js';
import RefreshToken from '../../../src/models/RefreshToken.js';
import Report from '../../../src/models/Report.js';
import Comment from '../../../src/models/Comment.js';
import User from '../../../src/models/User.js';
import UserSettings from '../../../src/models/UserSettings.js';
import Follow from '../../../src/models/Follow.js';
import Post from '../../../src/models/Post.js';
import { hashRefreshToken } from '../../../src/utils/refreshTokenHash.js';
import {
  createQueryChain,
  runSchemaPostHook,
  runSchemaPreHook,
} from '../../shared/modelTestUtils.js';

const USER_ID = '507f191e810c19729de860ea';
const OTHER_USER_ID = '507f191e810c19729de860eb';
const POST_ID = '507f191e810c19729de860ec';
const COMMENT_ID = '507f191e810c19729de860ed';
const REPORT_ID = '507f191e810c19729de860ee';

const originals = {
  Message: {
    create: Message.create,
    find: Message.find,
    aggregate: Message.aggregate,
    updateMany: Message.updateMany,
    countDocuments: Message.countDocuments,
  },
  Notification: {
    findOne: Notification.findOne,
    create: Notification.create,
    find: Notification.find,
    updateMany: Notification.updateMany,
    countDocuments: Notification.countDocuments,
    deleteMany: Notification.deleteMany,
  },
  RefreshToken: {
    updateMany: RefreshToken.updateMany,
    create: RefreshToken.create,
    findOne: RefreshToken.findOne,
    updateOne: RefreshToken.updateOne,
    find: RefreshToken.find,
  },
  Report: {
    findOne: Report.findOne,
    countDocuments: Report.countDocuments,
    create: Report.create,
    updateMany: Report.updateMany,
    find: Report.find,
    findById: Report.findById,
    aggregate: Report.aggregate,
  },
  Comment: {
    find: Comment.find,
    findById: Comment.findById,
    updateOne: Comment.updateOne,
  },
  User: {
    findById: User.findById,
  },
  UserSettings: {
    findOne: UserSettings.findOne,
  },
  Follow: {
    findOne: Follow.findOne,
  },
  Post: {
    findById: Post.findById,
    updateOne: Post.updateOne,
  },
};

afterEach(() => {
  Object.assign(Message, originals.Message);
  Object.assign(Notification, originals.Notification);
  Object.assign(RefreshToken, originals.RefreshToken);
  Object.assign(Report, originals.Report);
  Object.assign(Comment, originals.Comment);
  Object.assign(User, originals.User);
  Object.assign(UserSettings, originals.UserSettings);
  Object.assign(Follow, originals.Follow);
  Object.assign(Post, originals.Post);
});

describe('models/Message', () => {
  it('message statics should validate permissions before sending', async () => {
    assert.equal(
      Message.getConversationId(USER_ID, OTHER_USER_ID),
      `${USER_ID}_${OTHER_USER_ID}`
    );

    UserSettings.findOne = () =>
      createQueryChain({ blockedUsers: [USER_ID] });
    assert.deepEqual(
      await Message.sendMessage({ sender: USER_ID, receiver: OTHER_USER_ID, content: 'hi' }),
      { success: false, error: 'Cannot send message to this user' }
    );

    UserSettings.findOne = () => createQueryChain({ blockedUsers: [] });
    User.findById = () => createQueryChain(null);
    assert.deepEqual(
      await Message.sendMessage({ sender: USER_ID, receiver: OTHER_USER_ID, content: 'hi' }),
      { success: false, error: 'User not found' }
    );

    User.findById = () =>
      createQueryChain({ privacy: { allowMessages: 'none' } });
    assert.deepEqual(
      await Message.sendMessage({ sender: USER_ID, receiver: OTHER_USER_ID, content: 'hi' }),
      { success: false, error: 'User has disabled messages' }
    );

    User.findById = () =>
      createQueryChain({ privacy: { allowMessages: 'followers' } });
    Follow.findOne = () => createQueryChain(null);
    assert.deepEqual(
      await Message.sendMessage({ sender: USER_ID, receiver: OTHER_USER_ID, content: 'hi' }),
      { success: false, error: 'User only accepts messages from followers' }
    );
  });

  it('message statics should create and fetch conversations, read state, and unread counts', async () => {
    UserSettings.findOne = () => createQueryChain({ blockedUsers: [] });
    User.findById = () =>
      createQueryChain({ privacy: { allowMessages: 'everyone' } });
    Message.create = async docs => [
      {
        _id: 'message-1',
        ...docs[0],
        populate: async () => ({ _id: 'message-1', populated: true }),
      },
    ];

    let result = await Message.sendMessage({
      sender: USER_ID,
      receiver: OTHER_USER_ID,
      content: 'hello',
      media: [{ url: 'https://example.com/file.jpg', type: 'image' }],
    });
    assert.equal(result.success, true);
    assert.deepEqual(result.message, { _id: 'message-1', populated: true });

    const capturedFindQueries = [];
    Message.find = query => {
      capturedFindQueries.push(query);
      return {
        sort() {
          return this;
        },
        skip() {
          return this;
        },
        limit() {
          return this;
        },
        populate() {
          return this;
        },
        lean: async () => [{ _id: 'message-1' }],
      };
    };
    Message.aggregate = async pipeline => {
      assert.ok(Array.isArray(pipeline));
      return [{ _id: 'conversation-1', unreadCount: 2 }];
    };

    result = await Message.getConversation(USER_ID, OTHER_USER_ID, {
      page: 2,
      limit: 10,
      before: new Date('2026-01-01T00:00:00.000Z'),
    });
    assert.deepEqual(result, [{ _id: 'message-1' }]);
    assert.equal(capturedFindQueries[0].conversationId, `${USER_ID}_${OTHER_USER_ID}`);
    assert.ok(capturedFindQueries[0].createdAt.$lt instanceof Date);

    result = await Message.getConversations(USER_ID, { page: 1, limit: 5 });
    assert.deepEqual(result, [{ _id: 'conversation-1', unreadCount: 2 }]);

    let updateArgs = null;
    Message.updateMany = async (...args) => {
      updateArgs = args;
      return { modifiedCount: 2 };
    };
    Message.countDocuments = async query => {
      assert.equal(query.receiver, USER_ID);
      return 3;
    };

    assert.deepEqual(await Message.markAsRead('conversation-1', USER_ID), {
      modifiedCount: 2,
    });
    assert.equal(updateArgs[0].conversationId, 'conversation-1');
    assert.equal(updateArgs[0].receiver, USER_ID);
    assert.equal(await Message.getUnreadCount(USER_ID), 3);
  });
});

describe('models/Notification', () => {
  it('notification statics should skip self and disabled notifications, group duplicates, and create fresh notifications', async () => {
    assert.equal(
      await Notification.createNotification({
        recipient: USER_ID,
        sender: USER_ID,
        type: 'like',
        content: 'self',
      }),
      null
    );

    UserSettings.findOne = () =>
      createQueryChain({ notifications: { push: { enabled: false } } });
    assert.equal(
      await Notification.createNotification({
        recipient: USER_ID,
        sender: OTHER_USER_ID,
        type: 'like',
        content: 'disabled',
      }),
      null
    );

    UserSettings.findOne = () =>
      createQueryChain({ notifications: { push: { likes: false } } });
    assert.equal(
      await Notification.createNotification({
        recipient: USER_ID,
        sender: OTHER_USER_ID,
        type: 'like',
        content: 'type disabled',
      }),
      null
    );

    UserSettings.findOne = () =>
      createQueryChain({ notifications: { push: { likes: true, enabled: true } } });

    let savedNotification = null;
    Notification.findOne = async () => ({
      sender: OTHER_USER_ID,
      additionalSenders: [],
      groupCount: 1,
      content: 'old',
      save: async function () {
        savedNotification = this;
        return this;
      },
    });

    let grouped = await Notification.createNotification({
      recipient: USER_ID,
      sender: '507f191e810c19729de860ff',
      type: 'like',
      content: 'updated',
      groupKey: 'like_post_1',
    });
    assert.equal(grouped.groupCount, 2);
    assert.equal(grouped.content, 'updated');
    assert.equal(savedNotification.additionalSenders.length, 1);

    let createdPayload = null;
    Notification.findOne = async () => null;
    Notification.create = async payload => {
      createdPayload = payload;
      return { _id: 'notification-1', ...payload };
    };

    let created = await Notification.createNotification({
      recipient: USER_ID,
      sender: OTHER_USER_ID,
      type: 'comment',
      content: 'new notification',
      relatedPost: POST_ID,
      preview: { text: 'hello' },
      metadata: { source: 'test' },
    });
    assert.equal(created._id, 'notification-1');
    assert.equal(createdPayload.post, POST_ID);
    assert.equal(createdPayload.relatedPost, POST_ID);
    assert.equal(createdPayload.actionUrl, `/post/${POST_ID}`);
  });

  it('notification list and mutation helpers should build expected queries', async () => {
    const findQueries = [];
    let updateArgs = null;
    let deleteArgs = null;

    Notification.find = query => {
      findQueries.push(query);
      return {
        sort() {
          return this;
        },
        skip() {
          return this;
        },
        limit() {
          return this;
        },
        populate() {
          return this;
        },
        lean: async () => [{ _id: 'notification-1' }],
      };
    };
    Notification.updateMany = async (...args) => {
      updateArgs = args;
      return { modifiedCount: 1 };
    };
    Notification.countDocuments = async query => {
      assert.equal(query.recipient, USER_ID);
      return 4;
    };
    Notification.deleteMany = async (...args) => {
      deleteArgs = args;
      return { deletedCount: 2 };
    };

    assert.deepEqual(await Notification.getNotifications(USER_ID, { unreadOnly: true }), [
      { _id: 'notification-1' },
    ]);
    assert.deepEqual(findQueries[0], { recipient: USER_ID, isRead: false });
    assert.deepEqual(await Notification.markAsRead(USER_ID, ['a', 'b']), {
      modifiedCount: 1,
    });
    assert.deepEqual(updateArgs[0], {
      recipient: USER_ID,
      isRead: false,
      _id: { $in: ['a', 'b'] },
    });
    assert.equal(await Notification.getUnreadCount(USER_ID), 4);
    assert.deepEqual(await Notification.deleteOld(USER_ID, 7), { deletedCount: 2 });
    assert.equal(deleteArgs[0].recipient, USER_ID);
    assert.equal(deleteArgs[0].isRead, true);
    assert.ok(deleteArgs[0].createdAt.$lt instanceof Date);
  });
});

describe('models/RefreshToken', () => {
  it('createToken should revoke same-device sessions and persist hashed token values', async () => {
    let updateManyArgs = null;
    let createPayload = null;

    RefreshToken.updateMany = async (...args) => {
      updateManyArgs = args;
      return { modifiedCount: 1 };
    };
    RefreshToken.create = async payload => {
      createPayload = payload;
      return { _id: 'refresh-1', ...payload };
    };

    const result = await RefreshToken.createToken({
      user: USER_ID,
      token: 'raw-refresh-token',
      family: 'family-1',
      device: { id: 'device-1', type: 'mobile' },
    });

    assert.equal(updateManyArgs[0].user, USER_ID);
    assert.equal(updateManyArgs[0]['device.id'], 'device-1');
    assert.equal(createPayload.token, hashRefreshToken('raw-refresh-token'));
    assert.equal(createPayload.family, 'family-1');
    assert.equal(result._id, 'refresh-1');
  });

  it('verifyAndRotate should detect compromise, expire legacy plaintext tokens, and rotate valid tokens', async () => {
    let updateManyArgs = null;
    let createdPayload = null;

    RefreshToken.findOne = async query => {
      if (query.token === hashRefreshToken('stolen-token') && query.isRevoked === false) {
        return null;
      }
      if (query.token === 'stolen-token' && query.isRevoked === false) {
        return null;
      }
      if (query.token === hashRefreshToken('stolen-token')) {
        return { family: 'family-stolen' };
      }
      return null;
    };
    RefreshToken.updateMany = async (...args) => {
      updateManyArgs = args;
      return { modifiedCount: 2 };
    };

    let result = await RefreshToken.verifyAndRotate('stolen-token', 'new-token');
    assert.deepEqual(result, {
      success: false,
      error: 'Invalid token',
      compromised: true,
    });
    assert.deepEqual(updateManyArgs[0], { family: 'family-stolen' });

    const expiredTokenDoc = {
      user: USER_ID,
      token: 'legacy-plain-token',
      family: 'family-legacy',
      device: { id: 'device-1' },
      isRevoked: false,
      expiresAt: new Date(Date.now() - 60_000),
      save: async function () {
        return this;
      },
    };

    RefreshToken.findOne = async query => {
      if (query.token === hashRefreshToken('legacy-plain-token') && query.isRevoked === false) {
        return null;
      }
      if (query.token === 'legacy-plain-token' && query.isRevoked === false) {
        return expiredTokenDoc;
      }
      return null;
    };

    result = await RefreshToken.verifyAndRotate('legacy-plain-token', 'ignored');
    assert.deepEqual(result, { success: false, error: 'Token expired' });
    assert.equal(expiredTokenDoc.isRevoked, true);
    assert.equal(expiredTokenDoc.revokedReason, 'expired');
    assert.equal(expiredTokenDoc.token, hashRefreshToken('legacy-plain-token'));

    const activeTokenDoc = {
      user: USER_ID,
      token: hashRefreshToken('active-token'),
      family: 'family-active',
      device: { id: 'device-2' },
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60_000),
      save: async function () {
        return this;
      },
    };

    RefreshToken.findOne = async query => {
      if (query.token === hashRefreshToken('active-token') && query.isRevoked === false) {
        return activeTokenDoc;
      }
      return null;
    };
    RefreshToken.create = async payload => {
      createdPayload = payload;
      return { _id: 'rotated-token', ...payload };
    };

    result = await RefreshToken.verifyAndRotate('active-token', 'next-token');
    assert.equal(result.success, true);
    assert.equal(result.userId, USER_ID);
    assert.equal(result.newToken._id, 'rotated-token');
    assert.equal(activeTokenDoc.isRevoked, true);
    assert.equal(activeTokenDoc.revokedReason, 'rotated');
    assert.equal(createdPayload.token, hashRefreshToken('next-token'));
    assert.equal(createdPayload.family, 'family-active');
  });

  it('refresh token helper statics should build revoke, session, and last-used queries', async () => {
    const updateCalls = [];

    RefreshToken.updateOne = async (...args) => {
      updateCalls.push(args);
      return { acknowledged: true };
    };
    RefreshToken.updateMany = async (...args) => {
      updateCalls.push(args);
      return { acknowledged: true };
    };
    RefreshToken.find = query => {
      assert.equal(query.user, USER_ID);
      return {
        select() {
          return this;
        },
        sort() {
          return this;
        },
        lean: async () => [{ device: { id: 'device-1' } }],
      };
    };

    await RefreshToken.revokeToken('raw-refresh-token');
    await RefreshToken.revokeAllForUser(USER_ID, 'except-token');
    await RefreshToken.revokeFamily('family-1');
    assert.deepEqual(await RefreshToken.getActiveSessions(USER_ID), [
      { device: { id: 'device-1' } },
    ]);
    await RefreshToken.updateLastUsed('raw-refresh-token');

    assert.deepEqual(updateCalls[0][0], {
      token: { $in: ['raw-refresh-token', hashRefreshToken('raw-refresh-token')] },
    });
    assert.deepEqual(updateCalls[1][0], {
      user: USER_ID,
      isRevoked: false,
      token: {
        $nin: ['except-token', hashRefreshToken('except-token')],
      },
    });
    assert.deepEqual(updateCalls[2][0], { family: 'family-1', isRevoked: false });
    assert.deepEqual(updateCalls[3][0], {
      token: { $in: ['raw-refresh-token', hashRefreshToken('raw-refresh-token')] },
    });
  });
});

describe('models/Report', () => {
  it('createReport should validate duplicates and build snapshots for post/comment/user targets', async () => {
    assert.deepEqual(
      await Report.createReport({
        reporter: USER_ID,
        targetType: 'post',
        targetId: POST_ID,
        category: 'spam',
        reason: '',
      }),
      { success: false, error: 'Reason is required' }
    );

    Report.findOne = async () => ({ _id: 'existing-report' });
    assert.deepEqual(
      await Report.createReport({
        reporter: USER_ID,
        targetType: 'post',
        targetId: POST_ID,
        category: 'spam',
        reason: 'duplicate',
      }),
      { success: false, error: 'You have already reported this content' }
    );

    let createdPayload = null;
    let updateManyArgs = null;

    Report.findOne = async () => null;
    Report.countDocuments = async () => 2;
    Report.create = async payload => {
      createdPayload = { _id: 'report-1', ...payload };
      return createdPayload;
    };
    Report.updateMany = async (...args) => {
      updateManyArgs = args;
      return { modifiedCount: 1 };
    };

    Post.findById = () =>
      createQueryChain({
        user: OTHER_USER_ID,
        caption: 'post content',
        media: [{ url: 'https://example.com/post.jpg' }],
      });

    let result = await Report.createReport({
      reporter: USER_ID,
      targetType: 'post',
      targetId: POST_ID,
      category: 'spam',
      reason: 'spam',
      description: 'details',
    });
    assert.equal(result.success, true);
    assert.equal(createdPayload.priority, 30);
    assert.equal(createdPayload.targetUser, OTHER_USER_ID);
    assert.equal(createdPayload.contentSnapshot.text, 'post content');
    assert.equal(updateManyArgs[0].groupKey, `post_${POST_ID}`);

    Comment.findById = () =>
      createQueryChain({
        user: OTHER_USER_ID,
        content: 'comment body',
        post: POST_ID,
      });
    result = await Report.createReport({
      reporter: USER_ID,
      targetType: 'comment',
      targetId: COMMENT_ID,
      category: 'harassment',
      reason: 'rude',
    });
    assert.equal(result.success, true);
    assert.equal(createdPayload.parentPost, POST_ID);
    assert.equal(createdPayload.contentSnapshot.text, 'comment body');

    result = await Report.createReport({
      reporter: USER_ID,
      targetType: 'user',
      targetId: OTHER_USER_ID,
      category: 'impersonation',
      reason: 'fake account',
    });
    assert.equal(result.success, true);
    assert.equal(createdPayload.targetUser, OTHER_USER_ID);
  });

  it('report query and resolution helpers should build moderation views and save outcomes', async () => {
    Report.find = query => {
      assert.equal(query.status, 'pending');
      assert.equal(query.category, 'spam');
      return {
        sort() {
          return this;
        },
        skip() {
          return this;
        },
        limit() {
          return this;
        },
        populate() {
          return this;
        },
        lean: async () => [{ _id: 'report-1' }],
      };
    };
    Report.aggregate = async () => [{ byStatus: [], byCategory: [], recentTrend: [] }];

    assert.deepEqual(
      await Report.getReportsForModeration({ status: 'pending', category: 'spam' }),
      [{ _id: 'report-1' }]
    );
    assert.deepEqual(await Report.getReportStats(), [
      { byStatus: [], byCategory: [], recentTrend: [] },
    ]);

    Report.findById = async () => null;
    assert.equal(await Report.resolveReport(REPORT_ID, { action: 'warning' }, USER_ID), null);

    const reportDoc = {
      status: 'pending',
      resolution: null,
      actions: [],
      save: async function () {
        return this;
      },
    };
    Report.findById = async () => reportDoc;

    const resolved = await Report.resolveReport(
      REPORT_ID,
      { action: 'warning', note: 'moderated' },
      USER_ID
    );
    assert.equal(resolved.status, 'resolved');
    assert.equal(resolved.resolution.action, 'warning');
    assert.equal(resolved.resolution.resolvedBy, USER_ID);
    assert.equal(resolved.actions[0].action, 'resolved');
  });
});

describe('models/Comment', () => {
  it('comment methods and statics should soft-delete, fetch threads, and fetch replies', async () => {
    const comment = new Comment({
      user: USER_ID,
      content: 'hello',
      post: POST_ID,
      parentComment: COMMENT_ID,
    });
    const originalSave = comment.save;
    const updates = [];

    Comment.updateOne = async (...args) => {
      updates.push(args);
      return { acknowledged: true };
    };
    Post.updateOne = async (...args) => {
      updates.push(args);
      return { acknowledged: true };
    };
    comment.save = async function () {
      return this;
    };

    const deleted = await comment.softDelete();
    assert.equal(deleted.isDeleted, true);
    assert.equal(deleted.content, '[Deleted]');
    assert.equal(updates.length, 2);

    const findResponses = [
      {
        sort() {
          return this;
        },
        skip() {
          return this;
        },
        limit() {
          return this;
        },
        populate() {
          return this;
        },
        lean: async () => [
          { _id: 'comment-1', parentComment: null },
          { _id: 'comment-2', parentComment: null },
        ],
      },
      {
        sort() {
          return this;
        },
        limit() {
          return this;
        },
        populate() {
          return this;
        },
        lean: async () => [
          { _id: 'reply-1', parentComment: 'comment-1' },
          { _id: 'reply-2', parentComment: 'comment-1' },
          { _id: 'reply-3', parentComment: 'comment-2' },
        ],
      },
      {
        sort() {
          return this;
        },
        skip() {
          return this;
        },
        limit() {
          return this;
        },
        populate() {
          return this;
        },
        lean: async () => [{ _id: 'reply-page-1' }],
      },
      {
        sort() {
          return this;
        },
        skip() {
          return this;
        },
        limit() {
          return this;
        },
        populate() {
          return this;
        },
        lean: async () => [{ _id: 'comment-no-replies' }],
      },
    ];
    Comment.find = () => findResponses.shift();

    let result = await Comment.getCommentsForPost(POST_ID, {
      sortBy: 'likesCount',
      includeReplies: true,
      replyLimit: 1,
    });
    assert.equal(result[0].replies.length, 1);
    assert.equal(result[0].hasMoreReplies, true);
    assert.equal(result[1].hasMoreReplies, false);

    result = await Comment.getReplies(COMMENT_ID, { page: 2, limit: 5 });
    assert.deepEqual(result, [{ _id: 'reply-page-1' }]);

    result = await Comment.getCommentsForPost(POST_ID, {
      includeReplies: false,
      sortBy: 'oldest',
    });
    assert.deepEqual(result, [{ _id: 'comment-no-replies' }]);

    comment.save = originalSave;
  });

  it('comment hooks should derive depth/rootComment and update counters for new comments', async () => {
    const childComment = new Comment({
      user: USER_ID,
      content: 'reply',
      post: POST_ID,
      parentComment: COMMENT_ID,
    });
    const updates = [];

    Comment.findById = async () => ({
      _id: COMMENT_ID,
      depth: 2,
      rootComment: '507f191e810c19729de860ff',
    });

    await runSchemaPreHook(Comment, 'save', childComment);

    assert.equal(childComment.depth, 3);
    assert.equal(childComment.rootComment.toString(), '507f191e810c19729de860ff');
    assert.equal(childComment.wasNew, true);

    Comment.updateOne = async (...args) => {
      updates.push(args);
      return { acknowledged: true };
    };
    Post.updateOne = async (...args) => {
      updates.push(args);
      return { acknowledged: true };
    };

    await runSchemaPostHook(Comment, 'save', childComment, [childComment]);

    assert.equal(updates.length, 2);
    assert.equal(updates[0][0]._id.toString(), COMMENT_ID);
    assert.equal(updates[1][0]._id.toString(), POST_ID);
  });
});
