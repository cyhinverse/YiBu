import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import AdminService from '../../../../src/modules/admin/admin.service.js';
import adminRepository from '../../../../src/modules/admin/admin.repository.js';
import NotificationModel from '../../../../src/models/Notification.js';
import ReportService from '../../../../src/modules/report/report.service.js';
import logger from '../../../../src/configs/logger.js';

const ADMIN_ID = '507f191e810c19729de860ea';
const USER_ID = '507f191e810c19729de860eb';

const originalRepositoryMethods = { ...adminRepository };
const originalStartSession = mongoose.startSession;
const originalLogAdminAction = AdminService._logAdminAction;
const originalSuspendUser = AdminService.suspendUser;
const originalNotificationCreate = NotificationModel.create;
const originalResolveReport = ReportService.resolveReport;
const originalLoggerInfo = logger.info;

function makeChain(value) {
  return {
    select() {
      return this;
    },
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
    session: async () => value,
  };
}

function makePopulateThenable(value) {
  return {
    populate() {
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(value).then(resolve, reject);
    },
  };
}

afterEach(() => {
  Object.assign(adminRepository, originalRepositoryMethods);
  mongoose.startSession = originalStartSession;
  AdminService._logAdminAction = originalLogAdminAction;
  AdminService.suspendUser = originalSuspendUser;
  NotificationModel.create = originalNotificationCreate;
  ReportService.resolveReport = originalResolveReport;
  logger.info = originalLoggerInfo;
});

describe('AdminService', () => {
  it('getAllUsers should apply query filters and pagination metadata', async () => {
    let queryFromFind;
    adminRepository.userFind = query => {
      queryFromFind = query;
      return makeChain([{ _id: USER_ID }]);
    };
    adminRepository.userCountDocuments = async () => 11;

    const result = await AdminService.getAllUsers({
      page: 2,
      limit: 5,
      search: 'john',
      status: 'active',
      role: 'user',
      sortBy: 'lastLogin',
      sortOrder: -1,
    });

    assert.equal(Array.isArray(queryFromFind.$or), true);
    assert.equal(queryFromFind['moderation.status'], 'active');
    assert.equal(queryFromFind.isAdmin, false);
    assert.equal(result.total, 11);
    assert.equal(result.totalPages, 3);
    assert.equal(result.hasMore, true);
  });

  it('getUserById should throw when user is not found', async () => {
    adminRepository.userFindById = () => makeChain(null);

    await assert.rejects(
      AdminService.getUserById('missing-user'),
      err => err?.statusCode === 404
    );
  });

  it('getUserById should return user details with settings and recent reports', async () => {
    adminRepository.userFindById = () =>
      makeChain({ _id: USER_ID, username: 'user-a' });
    adminRepository.userSettingsFindOne = () => makeChain({ theme: 'dark' });
    adminRepository.reportFind = () => makeChain([{ _id: 'report-1' }, { _id: 'report-2' }]);

    const result = await AdminService.getUserById(USER_ID);
    assert.equal(result.username, 'user-a');
    assert.equal(result.settings.theme, 'dark');
    assert.equal(result.reportsCount, 2);
  });

  it('getUserPosts/getUserReports/getPostReports should return paginated results', async () => {
    adminRepository.postFind = () => makeChain([{ _id: 'post-1' }]);
    adminRepository.postCountDocuments = async () => 1;
    adminRepository.reportFind = () => makeChain([{ _id: 'report-1' }]);
    adminRepository.reportCountDocuments = async () => 1;

    const posts = await AdminService.getUserPosts(USER_ID, { page: 1, limit: 10 });
    const reportsByUser = await AdminService.getUserReports(USER_ID, {
      page: 1,
      limit: 10,
    });
    const reportsByPost = await AdminService.getPostReports('post-1', {
      page: 1,
      limit: 10,
    });

    assert.equal(posts.posts.length, 1);
    assert.equal(reportsByUser.reports.length, 1);
    assert.equal(reportsByPost.reports.length, 1);
  });

  it('updateUser should normalize role/status/isVerified and log admin action', async () => {
    let updateDoc;
    let loggedAction;
    adminRepository.userFindByIdAndUpdate = (_id, update) => {
      updateDoc = update;
      return {
        select: async () => ({ _id: USER_ID, username: 'updated' }),
      };
    };
    AdminService._logAdminAction = async (...args) => {
      loggedAction = args[1];
    };

    const result = await AdminService.updateUser(
      USER_ID,
      {
        role: 'admin',
        isVerified: true,
        status: 'warned',
      },
      ADMIN_ID
    );

    assert.equal(updateDoc.$set.isAdmin, true);
    assert.equal(updateDoc.$set.verified, true);
    assert.equal(updateDoc.$set['moderation.status'], 'warned');
    assert.equal(loggedAction, 'update_user');
    assert.equal(result.username, 'updated');
  });

  it('updateUser should throw when target user does not exist', async () => {
    adminRepository.userFindByIdAndUpdate = () => ({
      select: async () => null,
    });

    await assert.rejects(
      AdminService.updateUser(USER_ID, { role: 'user' }, ADMIN_ID),
      err => err?.statusCode === 404
    );
  });

  it('banUser should revoke tokens and commit transaction for existing user', async () => {
    let committed = false;
    let refreshUpdateQuery;
    const fakeSession = {
      startTransaction() {},
      commitTransaction: async () => {
        committed = true;
      },
      abortTransaction: async () => {},
      endSession() {},
    };

    mongoose.startSession = async () => fakeSession;
    adminRepository.userFindByIdAndUpdate = async () => ({ _id: USER_ID });
    adminRepository.refreshTokenUpdateMany = (query, update) => {
      refreshUpdateQuery = { query, update };
      return {
        session: async () => ({}),
      };
    };
    AdminService._logAdminAction = async () => {};

    const result = await AdminService.banUser(USER_ID, ADMIN_ID, 'abuse');

    assert.equal(result._id, USER_ID);
    assert.equal(refreshUpdateQuery.query.user, USER_ID);
    assert.equal(refreshUpdateQuery.update.revokedReason, 'user_banned');
    assert.equal(committed, true);
  });

  it('banUser should abort transaction when user does not exist', async () => {
    let aborted = false;
    const fakeSession = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {
        aborted = true;
      },
      endSession() {},
    };

    mongoose.startSession = async () => fakeSession;
    adminRepository.userFindByIdAndUpdate = async () => null;

    await assert.rejects(
      AdminService.banUser(USER_ID, ADMIN_ID),
      err => err?.statusCode === 404
    );
    assert.equal(aborted, true);
  });

  it('unbanUser should throw when user is not found', async () => {
    adminRepository.userFindByIdAndUpdate = async () => null;

    await assert.rejects(
      AdminService.unbanUser(USER_ID, ADMIN_ID),
      err => err?.statusCode === 404
    );
  });

  it('suspendUser should revoke tokens, notify user and commit transaction', async () => {
    let committed = false;
    let notificationCalls = 0;
    const fakeSession = {
      startTransaction() {},
      commitTransaction: async () => {
        committed = true;
      },
      abortTransaction: async () => {},
      endSession() {},
    };

    mongoose.startSession = async () => fakeSession;
    adminRepository.userFindByIdAndUpdate = async () => ({ _id: USER_ID });
    adminRepository.refreshTokenUpdateMany = () => ({
      session: async () => ({}),
    });
    NotificationModel.create = async () => {
      notificationCalls += 1;
    };
    AdminService._logAdminAction = async () => {};

    const result = await AdminService.suspendUser(USER_ID, ADMIN_ID, 5, 'spam');

    assert.equal(result._id, USER_ID);
    assert.equal(notificationCalls, 1);
    assert.equal(committed, true);
  });

  it('warnUser should notify user and trigger temporary suspend after 3 warnings', async () => {
    let suspended = false;
    let notificationCalls = 0;
    adminRepository.userFindByIdAndUpdate = async () => ({
      _id: USER_ID,
      moderation: { warnings: 3 },
    });
    NotificationModel.create = async () => {
      notificationCalls += 1;
    };
    AdminService._logAdminAction = async () => {};
    AdminService.suspendUser = async () => {
      suspended = true;
    };

    const result = await AdminService.warnUser(USER_ID, ADMIN_ID, 'warning reason');

    assert.equal(result._id, USER_ID);
    assert.equal(notificationCalls, 1);
    assert.equal(suspended, true);
  });

  it('warnUser should throw when user does not exist', async () => {
    adminRepository.userFindByIdAndUpdate = async () => null;

    await assert.rejects(
      AdminService.warnUser(USER_ID, ADMIN_ID, 'reason'),
      err => err?.statusCode === 404
    );
  });

  it('getAllPosts should map status/type filters and pagination', async () => {
    let queryFromFind;
    adminRepository.postFind = query => {
      queryFromFind = query;
      return makeChain([{ _id: 'post-1' }]);
    };
    adminRepository.postCountDocuments = async () => 25;

    const result = await AdminService.getAllPosts({
      page: 2,
      limit: 10,
      status: 'hidden',
      type: 'mixed',
      sortBy: 'likes',
      sortOrder: -1,
    });

    assert.equal(queryFromFind.isDeleted, true);
    assert.equal(Array.isArray(queryFromFind.$and), true);
    assert.equal(result.totalPages, 3);
    assert.equal(result.hasMore, true);
  });

  it('moderatePost should reject invalid action and not-found post', async () => {
    await assert.rejects(
      AdminService.moderatePost('post-x', ADMIN_ID, 'invalid-action'),
      err => err?.statusCode === 400
    );

    adminRepository.postFindById = () => makeChain(null);
    await assert.rejects(
      AdminService.moderatePost('post-missing', ADMIN_ID, 'approve'),
      err => err?.statusCode === 404
    );
  });

  it('moderatePost should remove post, update author count and notify user', async () => {
    let committed = false;
    let userUpdateCalled = false;
    let notificationCalls = 0;
    const fakeSession = {
      startTransaction() {},
      commitTransaction: async () => {
        committed = true;
      },
      abortTransaction: async () => {},
      endSession() {},
    };

    mongoose.startSession = async () => fakeSession;
    adminRepository.postFindById = () =>
      makeChain({
        _id: 'post-2',
        isDeleted: false,
        user: USER_ID,
      });
    adminRepository.postFindByIdAndUpdate = () =>
      makePopulateThenable({
        _id: 'post-2',
        user: { _id: USER_ID },
      });
    adminRepository.userFindByIdAndUpdate = () => ({
      session: async () => {
        userUpdateCalled = true;
      },
    });
    NotificationModel.create = async () => {
      notificationCalls += 1;
    };
    AdminService._logAdminAction = async () => {};

    const result = await AdminService.moderatePost('post-2', ADMIN_ID, 'remove', 'spam');

    assert.equal(result._id, 'post-2');
    assert.equal(userUpdateCalled, true);
    assert.equal(notificationCalls, 1);
    assert.equal(committed, true);
  });

  it('deletePost should delegate to moderatePost remove action', async () => {
    const originalModeratePost = AdminService.moderatePost;
    let receivedArgs;
    AdminService.moderatePost = async (...args) => {
      receivedArgs = args;
      return { _id: 'post-3' };
    };

    try {
      const result = await AdminService.deletePost('post-3', ADMIN_ID, 'reason');
      assert.equal(result._id, 'post-3');
      assert.deepEqual(receivedArgs, ['post-3', ADMIN_ID, 'remove', 'reason']);
    } finally {
      AdminService.moderatePost = originalModeratePost;
    }
  });

  it('getAllComments should apply search/status/sort filters', async () => {
    let queryFromFind;
    adminRepository.commentFind = query => {
      queryFromFind = query;
      return makeChain([{ _id: 'comment-1' }]);
    };
    adminRepository.commentCountDocuments = async () => 12;

    const result = await AdminService.getAllComments({
      page: 1,
      limit: 10,
      search: 'toxic',
      status: 'flagged',
      sortBy: 'likes',
      sortOrder: -1,
    });

    assert.equal(queryFromFind.isDeleted, false);
    assert.equal(queryFromFind['moderation.status'], 'flagged');
    assert.ok(queryFromFind.content.$regex);
    assert.equal(result.total, 12);
    assert.equal(result.hasMore, true);
  });

  it('moderateComment should remove and approve comments with counter updates', async () => {
    let postCountDelta = 0;
    let notificationCalls = 0;
    const removedComment = {
      _id: 'comment-2',
      post: 'post-2',
      user: USER_ID,
      isDeleted: false,
      moderation: {},
      save: async () => {},
    };
    adminRepository.commentFindById = async () => removedComment;
    adminRepository.postFindByIdAndUpdate = async (_id, update) => {
      postCountDelta += update.$inc.commentsCount;
    };
    NotificationModel.create = async () => {
      notificationCalls += 1;
    };
    AdminService._logAdminAction = async () => {};

    const removed = await AdminService.moderateComment(
      'comment-2',
      ADMIN_ID,
      'remove',
      'abuse'
    );
    assert.equal(removed.isDeleted, true);
    assert.equal(postCountDelta, -1);
    assert.equal(notificationCalls, 1);

    const approvedComment = {
      _id: 'comment-3',
      post: 'post-3',
      user: USER_ID,
      isDeleted: true,
      moderation: {},
      save: async () => {},
    };
    adminRepository.commentFindById = async () => approvedComment;

    const approved = await AdminService.moderateComment(
      'comment-3',
      ADMIN_ID,
      'approve'
    );
    assert.equal(approved.isDeleted, false);
  });

  it('getReports should normalize filters and include pagination metadata', async () => {
    let queryFromFind;
    adminRepository.reportFind = query => {
      queryFromFind = query;
      return makeChain([{ _id: 'report-1' }]);
    };
    adminRepository.reportCountDocuments = async () => 21;

    const result = await AdminService.getReports({
      page: 2,
      limit: 10,
      status: 'dismissed',
      category: 'spam',
      targetType: 'post',
      priority: '2',
      sortBy: 'createdAt',
      sortOrder: -1,
    });

    assert.equal(queryFromFind.status, 'rejected');
    assert.equal(queryFromFind.category, 'spam');
    assert.equal(queryFromFind.targetType, 'post');
    assert.equal(queryFromFind.priority, 2);
    assert.equal(result.totalPages, 3);
    assert.equal(result.hasMore, true);
  });

  it('reviewReport should reject invalid decision and map action aliases', async () => {
    await assert.rejects(
      AdminService.reviewReport('report-x', ADMIN_ID, { decision: 'invalid' }),
      err => err?.statusCode === 400
    );

    let receivedPayload;
    ReportService.resolveReport = async (_reportId, _adminId, payload) => {
      receivedPayload = payload;
      return { _id: 'report-y' };
    };
    AdminService._logAdminAction = async () => {};

    const result = await AdminService.reviewReport('report-y', ADMIN_ID, {
      action: 'warn',
      notes: 'checked',
    });

    assert.equal(receivedPayload.decision, 'resolved');
    assert.equal(receivedPayload.actionTaken, 'warn_user');
    assert.equal(result._id, 'report-y');
  });

  it('reviewReport should derive resolved decision from actionTaken only', async () => {
    let payloadFromResolve;
    ReportService.resolveReport = async (_reportId, _adminId, payload) => {
      payloadFromResolve = payload;
      return { _id: 'report-z' };
    };
    AdminService._logAdminAction = async () => {};

    await AdminService.reviewReport('report-z', ADMIN_ID, {
      actionTaken: 'remove_content',
      notes: 'ok',
    });

    assert.equal(payloadFromResolve.decision, 'resolved');
    assert.equal(payloadFromResolve.actionTaken, 'remove_content');
  });

  it('getDashboardStats should aggregate user/post/report counters', async () => {
    let callCount = 0;
    adminRepository.userCountDocuments = async () => {
      callCount += 1;
      return [100, 80, 5, 20, 2][callCount - 1];
    };
    adminRepository.postCountDocuments = async () => {
      callCount += 1;
      return [300, 10, 50][callCount - 6];
    };
    adminRepository.reportCountDocuments = async () => {
      callCount += 1;
      return [7, 40][callCount - 9];
    };

    const stats = await AdminService.getDashboardStats();
    assert.equal(stats.users.total, 100);
    assert.equal(stats.users.active, 80);
    assert.equal(stats.posts.total, 300);
    assert.equal(stats.reports.pending, 7);
    assert.equal(typeof stats.timestamp, 'object');
  });

  it('getUserGrowthStats should fill missing dates and compute growth percentage', async () => {
    const startDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const startDateKey = startDate.toISOString().split('T')[0];

    adminRepository.userAggregate = async () => [{ _id: startDateKey, count: 3 }];
    adminRepository.userCountDocuments = async () => 0;

    const result = await AdminService.getUserGrowthStats(2);
    assert.equal(result.totalGrowth >= 3, true);
    assert.equal(result.percentage, 100);
    assert.equal(Array.isArray(result.chartData), true);
    assert.equal(result.chartData.length >= 2, true);
  });

  it('getPostStats should delegate aggregation query and return stats', async () => {
    adminRepository.postAggregate = async () => [
      { _id: '2026-02-20', count: 2, totalLikes: 5, totalComments: 3 },
    ];

    const result = await AdminService.getPostStats(7);
    assert.equal(result.length, 1);
    assert.equal(result[0].count, 2);
  });

  it('getTopEngagedUsers should fetch limited active users sorted by engagement rate', async () => {
    let queryFromFind;
    adminRepository.userFind = query => {
      queryFromFind = query;
      return makeChain([{ _id: USER_ID, username: 'u1' }]);
    };

    const result = await AdminService.getTopEngagedUsers(5);
    assert.equal(queryFromFind.isActive, true);
    assert.equal(queryFromFind['moderation.status'], 'active');
    assert.equal(result.length, 1);
  });

  it('getInteractions should return typed interaction feed and stats totals', async () => {
    adminRepository.likeCountDocuments = async () => 10;
    adminRepository.commentCountDocuments = async () => 20;
    adminRepository.followCountDocuments = async () => 30;
    adminRepository.savePostCountDocuments = async () => 40;
    adminRepository.userInteractionCountDocuments = async () => 50;
    adminRepository.reportCountDocuments = async () => 60;
    adminRepository.likeFind = () =>
      makeChain([
        {
          _id: 'like-1',
          user: { name: 'Alice', username: 'alice' },
          post: { caption: 'caption', user: { name: 'Bob' } },
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
        },
      ]);

    const result = await AdminService.getInteractions({
      page: 1,
      limit: 10,
      type: 'like',
    });

    assert.equal(result.stats.likes, 10);
    assert.equal(result.total, 10);
    assert.equal(result.interactions.length, 1);
    assert.equal(result.interactions[0].type, 'like');
  });

  it('getInteractions should apply search filter over user identity', async () => {
    adminRepository.likeCountDocuments = async () => 2;
    adminRepository.commentCountDocuments = async () => 0;
    adminRepository.followCountDocuments = async () => 0;
    adminRepository.savePostCountDocuments = async () => 0;
    adminRepository.userInteractionCountDocuments = async () => 0;
    adminRepository.reportCountDocuments = async () => 0;
    adminRepository.likeFind = () =>
      makeChain([
        {
          _id: 'like-2',
          user: { name: 'Alice', username: 'alice' },
          post: { caption: 'caption', user: { name: 'Bob' } },
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
        },
      ]);

    const result = await AdminService.getInteractions({
      page: 1,
      limit: 10,
      type: 'like',
      search: 'nomatch',
    });

    assert.equal(result.total, 0);
    assert.equal(result.interactions.length, 0);
  });

  it('_logAdminAction should write structured log entry', async () => {
    let message;
    let meta;
    logger.info = (msg, payload) => {
      message = msg;
      meta = payload;
    };

    await AdminService._logAdminAction(ADMIN_ID, 'test_action', 'system', null, {
      reason: 'test',
    });

    assert.equal(message, 'Admin action: test_action');
    assert.equal(meta.adminId, ADMIN_ID);
    assert.equal(meta.action, 'test_action');
    assert.equal(meta.targetType, 'system');
  });

  it('broadcastNotification should reject invalid target group', async () => {
    await assert.rejects(
      AdminService.broadcastNotification(ADMIN_ID, {
        content: 'hello',
        targetGroup: 'invalid-group',
      }),
      err => err?.statusCode === 400
    );
  });

  it('broadcastNotification should respect user settings and return sent/skipped counts', async () => {
    let insertedDocs;
    adminRepository.userFind = () =>
      makeChain([{ _id: USER_ID }, { _id: '507f191e810c19729de860ec' }]);
    adminRepository.userSettingsFind = () =>
      makeChain([
        {
          user: USER_ID,
          notifications: { push: { enabled: true, systemUpdates: true } },
        },
        {
          user: '507f191e810c19729de860ec',
          notifications: { push: { enabled: false } },
        },
      ]);
    adminRepository.notificationInsertMany = async docs => {
      insertedDocs = docs;
    };
    AdminService._logAdminAction = async () => {};

    const result = await AdminService.broadcastNotification(ADMIN_ID, {
      content: 'system update',
      targetGroup: 'all',
      title: 'Notice',
      priority: 'high',
    });

    assert.equal(insertedDocs.length, 1);
    assert.equal(insertedDocs[0].recipient, USER_ID);
    assert.equal(result.sentCount, 1);
    assert.equal(result.skippedCount, 1);
    assert.equal(result.targetCount, 2);
  });

  it('getAllUsers should map admin role filter to isAdmin=true', async () => {
    let receivedQuery;
    adminRepository.userFind = query => {
      receivedQuery = query;
      return makeChain([]);
    };
    adminRepository.userCountDocuments = async () => 0;

    await AdminService.getAllUsers({ role: 'admin' });
    assert.equal(receivedQuery.isAdmin, true);
  });

  it('unbanUser should restore active moderation state and log action', async () => {
    let loggedAction;
    adminRepository.userFindByIdAndUpdate = async () => ({ _id: USER_ID });
    AdminService._logAdminAction = async (_adminId, action) => {
      loggedAction = action;
    };

    const result = await AdminService.unbanUser(USER_ID, ADMIN_ID);

    assert.equal(result._id, USER_ID);
    assert.equal(loggedAction, 'unban_user');
  });

  it('suspendUser should abort when target user does not exist', async () => {
    let aborted = false;
    const fakeSession = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {
        aborted = true;
      },
      endSession() {},
    };
    mongoose.startSession = async () => fakeSession;
    adminRepository.userFindByIdAndUpdate = async () => null;

    await assert.rejects(
      AdminService.suspendUser(USER_ID, ADMIN_ID, 7, 'reason'),
      err => err?.statusCode === 404
    );
    assert.equal(aborted, true);
  });

  it('getAllPosts should map remaining status/type branches', async () => {
    const queries = [];
    adminRepository.postFind = query => {
      queries.push(query);
      return makeChain([]);
    };
    adminRepository.postCountDocuments = async () => 0;

    await AdminService.getAllPosts({ status: 'active', type: 'text' });
    await AdminService.getAllPosts({ status: 'flagged', type: 'image' });
    await AdminService.getAllPosts({ status: 'pending', type: 'video' });
    await AdminService.getAllPosts({ status: 'custom_status' });
    await AdminService.getAllPosts({});

    assert.equal(queries[0]['moderation.status'], 'approved');
    assert.equal(Array.isArray(queries[0].$or), true);
    assert.equal(queries[1]['moderation.status'], 'flagged');
    assert.equal(Array.isArray(queries[1].$and), true);
    assert.equal(queries[2]['moderation.status'], 'pending');
    assert.equal(Array.isArray(queries[2].$and), true);
    assert.equal(queries[3]['moderation.status'], 'custom_status');
    assert.equal(queries[4].isDeleted, false);
  });

  it('getAllComments should map remaining status branches', async () => {
    const queries = [];
    adminRepository.commentFind = query => {
      queries.push(query);
      return makeChain([]);
    };
    adminRepository.commentCountDocuments = async () => 0;

    await AdminService.getAllComments({ status: 'active' });
    await AdminService.getAllComments({ status: 'pending' });
    await AdminService.getAllComments({ status: 'hidden' });
    await AdminService.getAllComments({ status: 'unknown_status' });
    await AdminService.getAllComments({});

    assert.equal(queries[0]['moderation.status'], 'approved');
    assert.equal(queries[0].isDeleted, false);
    assert.equal(queries[1]['moderation.status'], 'pending');
    assert.equal(queries[1].isDeleted, false);
    assert.equal(queries[2].isDeleted, true);
    assert.equal(queries[3].isDeleted, false);
    assert.equal(queries[4].isDeleted, false);
  });

  it('moderatePost should restore deleted post on approve and update author counter', async () => {
    let incrementedBy = 0;
    let committed = false;
    const fakeSession = {
      startTransaction() {},
      commitTransaction: async () => {
        committed = true;
      },
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => fakeSession;
    adminRepository.postFindById = () =>
      makeChain({
        _id: 'post-restore',
        isDeleted: true,
        user: USER_ID,
      });
    adminRepository.postFindByIdAndUpdate = () =>
      makePopulateThenable({
        _id: 'post-restore',
        user: { _id: USER_ID },
      });
    adminRepository.userFindByIdAndUpdate = (_id, update) => ({
      session: async () => {
        incrementedBy += update.$inc.postsCount;
      },
    });
    AdminService._logAdminAction = async () => {};

    const result = await AdminService.moderatePost(
      'post-restore',
      ADMIN_ID,
      'approve'
    );

    assert.equal(result._id, 'post-restore');
    assert.equal(incrementedBy, 1);
    assert.equal(committed, true);
  });

  it('moderatePost should abort when update step returns null post', async () => {
    let aborted = false;
    const fakeSession = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {
        aborted = true;
      },
      endSession() {},
    };
    mongoose.startSession = async () => fakeSession;
    adminRepository.postFindById = () =>
      makeChain({
        _id: 'post-null',
        isDeleted: false,
        user: USER_ID,
      });
    adminRepository.postFindByIdAndUpdate = () => makePopulateThenable(null);

    await assert.rejects(
      AdminService.moderatePost('post-null', ADMIN_ID, 'flag'),
      err => err?.statusCode === 404
    );
    assert.equal(aborted, true);
  });

  it('moderateComment should validate invalid action, missing comment and hide alias behavior', async () => {
    await assert.rejects(
      AdminService.moderateComment('comment-x', ADMIN_ID, 'invalid'),
      err => err?.statusCode === 400
    );

    adminRepository.commentFindById = async () => null;
    await assert.rejects(
      AdminService.moderateComment('comment-missing', ADMIN_ID, 'remove'),
      err => err?.statusCode === 404
    );

    const hiddenComment = {
      _id: 'comment-hide',
      post: 'post-hide',
      user: USER_ID,
      content: 'original content',
      isDeleted: false,
      moderation: {},
      save: async () => {},
    };
    adminRepository.commentFindById = async () => hiddenComment;
    adminRepository.postFindByIdAndUpdate = async () => {};
    NotificationModel.create = async () => {};
    AdminService._logAdminAction = async () => {};

    const result = await AdminService.moderateComment(
      'comment-hide',
      ADMIN_ID,
      'hide',
      'spam'
    );

    assert.equal(result.isDeleted, true);
    assert.equal(result.content, 'original content');
    assert.equal(result.moderation.status, 'removed');
  });

  it('reviewReport should map legacy resolution value to decision/actionTaken', async () => {
    let payloadFromResolve;
    ReportService.resolveReport = async (_id, _adminId, payload) => {
      payloadFromResolve = payload;
      return { _id: 'report-legacy' };
    };
    AdminService._logAdminAction = async () => {};

    const result = await AdminService.reviewReport('report-legacy', ADMIN_ID, {
      resolution: 'user_warned',
      notes: 'legacy payload',
    });

    assert.equal(result._id, 'report-legacy');
    assert.equal(payloadFromResolve.decision, 'resolved');
    assert.equal(payloadFromResolve.actionTaken, 'warn_user');
  });

  it('reviewReport should normalize dismissed decision to rejected', async () => {
    let payloadFromResolve;
    ReportService.resolveReport = async (_id, _adminId, payload) => {
      payloadFromResolve = payload;
      return { _id: 'report-dismissed' };
    };
    AdminService._logAdminAction = async () => {};

    const result = await AdminService.reviewReport('report-dismissed', ADMIN_ID, {
      decision: 'dismissed',
      notes: 'no issue',
    });

    assert.equal(result._id, 'report-dismissed');
    assert.equal(payloadFromResolve.decision, 'rejected');
  });

  it('getInteractions should aggregate mixed interaction buckets when type is omitted', async () => {
    adminRepository.likeCountDocuments = async () => 1;
    adminRepository.commentCountDocuments = async () => 2;
    adminRepository.followCountDocuments = async () => 3;
    adminRepository.savePostCountDocuments = async () => 4;
    adminRepository.userInteractionCountDocuments = async () => 5;
    adminRepository.reportCountDocuments = async () => 6;

    adminRepository.likeFind = () =>
      makeChain([
        {
          _id: 'like-mix',
          user: { name: 'Alice', username: 'alice' },
          post: { caption: 'Like caption', user: { name: 'Bob' } },
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
        },
      ]);
    adminRepository.commentFind = () =>
      makeChain([
        {
          _id: 'comment-mix',
          user: { name: 'Carol', username: 'carol' },
          post: { caption: 'Comment caption', user: { name: 'Dave' } },
          content: 'nice post',
          createdAt: new Date('2026-02-01T01:00:00.000Z'),
        },
      ]);
    adminRepository.followFind = () =>
      makeChain([
        {
          _id: 'follow-mix',
          follower: { name: 'Eve', username: 'eve' },
          following: { name: 'Frank', username: 'frank' },
          createdAt: new Date('2026-02-01T02:00:00.000Z'),
        },
      ]);
    adminRepository.savePostFind = () =>
      makeChain([
        {
          _id: 'save-mix',
          user: { name: 'Grace', username: 'grace' },
          post: { caption: 'Save caption', user: { name: 'Heidi' } },
          createdAt: new Date('2026-02-01T03:00:00.000Z'),
        },
      ]);
    adminRepository.userInteractionFind = () =>
      makeChain([
        {
          _id: 'share-mix',
          user: { name: 'Ivan', username: 'ivan' },
          targetId: 'post-shared',
          createdAt: new Date('2026-02-01T04:00:00.000Z'),
        },
      ]);
    adminRepository.postFind = () =>
      makeChain([
        {
          _id: 'post-shared',
          caption: 'Shared caption',
          user: { name: 'Judy' },
        },
      ]);
    adminRepository.reportFind = () =>
      makeChain([
        {
          _id: 'report-mix',
          reporter: { name: 'Ken', username: 'ken' },
          targetUser: { name: 'Leo' },
          targetType: 'post',
          reason: 'spam',
          description: 'spam content',
          createdAt: new Date('2026-02-01T05:00:00.000Z'),
        },
      ]);

    const result = await AdminService.getInteractions({ page: 1, limit: 10 });

    assert.equal(result.total, 21);
    assert.equal(result.interactions.length, 6);
    assert.equal(result.stats.likes, 1);
    assert.equal(result.stats.reports, 6);
    assert.equal(result.interactions.some(i => i.type === 'comment'), true);
    assert.equal(result.interactions.some(i => i.type === 'follow'), true);
    assert.equal(result.interactions.some(i => i.type === 'save'), true);
    assert.equal(result.interactions.some(i => i.type === 'share'), true);
    assert.equal(result.interactions.some(i => i.type === 'report'), true);
  });

  it('broadcastNotification should support active/verified/new_users groups', async () => {
    let findCalls = 0;
    adminRepository.userFind = () => {
      findCalls += 1;
      return makeChain([{ _id: USER_ID }]);
    };
    adminRepository.userSettingsFind = () =>
      makeChain([
        {
          user: USER_ID,
          notifications: { push: { enabled: true, systemUpdates: true } },
        },
      ]);
    adminRepository.notificationInsertMany = async () => {};
    AdminService._logAdminAction = async () => {};

    const activeResult = await AdminService.broadcastNotification(ADMIN_ID, {
      content: 'active users',
      targetGroup: 'active',
    });
    const verifiedResult = await AdminService.broadcastNotification(ADMIN_ID, {
      content: 'verified users',
      targetGroup: 'verified',
    });
    const newUsersResult = await AdminService.broadcastNotification(ADMIN_ID, {
      content: 'new users',
      targetGroup: 'new_users',
    });

    assert.equal(findCalls, 3);
    assert.equal(activeResult.targetCount, 1);
    assert.equal(verifiedResult.targetCount, 1);
    assert.equal(newUsersResult.targetCount, 1);
  });

  it('getUserGrowthStats should compute percentage against previous period when available', async () => {
    const todayKey = new Date().toISOString().split('T')[0];
    adminRepository.userAggregate = async () => [{ _id: todayKey, count: 15 }];
    adminRepository.userCountDocuments = async () => 10;

    const result = await AdminService.getUserGrowthStats(1);

    assert.equal(result.totalGrowth >= 15, true);
    assert.equal(result.percentage, 50);
  });

  it('broadcastNotification should skip insert when no eligible users remain', async () => {
    let insertCalled = false;
    adminRepository.userFind = () => makeChain([{ _id: USER_ID }]);
    adminRepository.userSettingsFind = () =>
      makeChain([
        {
          user: USER_ID,
          notifications: { push: { enabled: false, systemUpdates: false } },
        },
      ]);
    adminRepository.notificationInsertMany = async () => {
      insertCalled = true;
    };
    AdminService._logAdminAction = async () => {};

    const result = await AdminService.broadcastNotification(ADMIN_ID, {
      content: 'none eligible',
      targetGroup: 'all',
    });

    assert.equal(result.sentCount, 0);
    assert.equal(result.skippedCount, 1);
    assert.equal(insertCalled, false);
  });
});

