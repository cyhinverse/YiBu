import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import ReportService from '../../../../src/modules/report/report.service.js';
import reportRepository from '../../../../src/modules/report/report.repository.js';
import NotificationModel from '../../../../src/models/Notification.js';
import logger from '../../../../src/configs/logger.js';

const REPORTER_ID = '507f191e810c19729de860ea';
const TARGET_ID = '507f191e810c19729de860eb';
const ADMIN_ID = '507f191e810c19729de860ec';

const originalRepoMethods = { ...reportRepository };
const originalStartSession = mongoose.startSession;
const originalNotificationCreate = NotificationModel.create;
const originalLoggerWarn = logger.warn;
const originalExecuteAction = ReportService._executeAction;

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
  Object.assign(reportRepository, originalRepoMethods);
  mongoose.startSession = originalStartSession;
  NotificationModel.create = originalNotificationCreate;
  logger.warn = originalLoggerWarn;
  ReportService._executeAction = originalExecuteAction;
});

describe('ReportService', () => {
  it('_normalizeCategory should map aliases and fallback unknown category to other', () => {
    assert.equal(
      ReportService._normalizeCategory('fake_account', 'irrelevant'),
      'impersonation'
    );
    assert.equal(
      ReportService._normalizeCategory('not-valid', 'some reason'),
      'other'
    );
    assert.equal(ReportService._normalizeCategory('spam', ''), 'spam');
  });

  it('_getDecisionText should map known decisions', () => {
    assert.equal(ReportService._getDecisionText('resolved'), 'Đã xử lý vi phạm');
    assert.equal(ReportService._getDecisionText('rejected'), 'Không phát hiện vi phạm');
    assert.equal(ReportService._getDecisionText('custom'), 'custom');
  });

  it('createReport should require reason', async () => {
    await assert.rejects(
      ReportService.createReport(REPORTER_ID, 'post', TARGET_ID, {}),
      err => err?.statusCode === 400
    );
  });

  it('createReport should reject invalid target type', async () => {
    await assert.rejects(
      ReportService.createReport(REPORTER_ID, 'invalid-type', TARGET_ID, {
        reason: 'spam',
      }),
      err => err?.statusCode === 400
    );
  });

  it('createReport should reject duplicate report in pending/reviewing status', async () => {
    reportRepository.reportFindOne = async () => ({ _id: 'existing-report' });

    await assert.rejects(
      ReportService.createReport(REPORTER_ID, 'post', TARGET_ID, {
        reason: 'spam',
      }),
      err => err?.statusCode === 409
    );
  });

  it('createReport should reject self-reporting target user', async () => {
    reportRepository.reportFindOne = async () => null;
    reportRepository.userFindById = () =>
      makePopulateLeanChain({
        _id: REPORTER_ID,
        username: 'reporter',
        name: 'Reporter',
      });

    await assert.rejects(
      ReportService.createReport(REPORTER_ID, 'user', REPORTER_ID, {
        reason: 'harassment',
      }),
      err => err?.statusCode === 403
    );
  });

  it('createReport should create message report and normalize snapshot/category', async () => {
    let createdPayload;
    reportRepository.reportFindOne = async () => null;
    reportRepository.messageFindById = () =>
      makePopulateLeanChain({
        _id: 'message-id',
        sender: TARGET_ID,
        content: 'bad message',
        type: 'image',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      });
    reportRepository.reportCreate = async payload => {
      createdPayload = payload;
      return { _id: 'report-id' };
    };
    reportRepository.reportFindById = () =>
      makePopulateLeanChain({
        _id: 'report-id',
        targetType: 'message',
      });

    const result = await ReportService.createReport(REPORTER_ID, 'message', TARGET_ID, {
      category: 'fake_account',
      reason: 'fake_account',
      description: 'spam content',
    });

    assert.equal(createdPayload.category, 'impersonation');
    assert.equal(createdPayload.targetUser, TARGET_ID);
    assert.equal(createdPayload.contentSnapshot.type, 'image');
    assert.equal(result._id, 'report-id');
  });

  it('createReport should build post and comment snapshots correctly', async () => {
    const snapshots = [];
    reportRepository.reportFindOne = async () => null;
    reportRepository.reportCreate = async payload => {
      snapshots.push(payload.contentSnapshot);
      return { _id: `report-${snapshots.length}` };
    };
    reportRepository.reportFindById = id => makePopulateLeanChain({ _id: id });
    reportRepository.postFindById = () =>
      makePopulateLeanChain({
        _id: 'post-1',
        user: TARGET_ID,
        caption: 'post caption',
        media: ['a', 'b', 'c', 'd'],
        createdAt: new Date('2025-01-02T00:00:00.000Z'),
      });
    reportRepository.commentFindById = () =>
      makePopulateLeanChain({
        _id: 'comment-1',
        user: TARGET_ID,
        post: 'post-1',
        content: 'comment content',
        createdAt: new Date('2025-01-03T00:00:00.000Z'),
      });

    await ReportService.createReport(REPORTER_ID, 'post', 'post-1', {
      reason: 'spam',
    });
    await ReportService.createReport(REPORTER_ID, 'comment', 'comment-1', {
      reason: 'harassment',
    });

    assert.equal(snapshots[0].caption, 'post caption');
    assert.equal(snapshots[0].media.length, 3);
    assert.equal(snapshots[1].content, 'comment content');
    assert.equal(snapshots[1].postId, 'post-1');
  });

  it('createReport should throw not found for missing post/comment/user/message targets', async () => {
    reportRepository.reportFindOne = async () => null;
    reportRepository.postFindById = () => makePopulateLeanChain(null);
    reportRepository.commentFindById = () => makePopulateLeanChain(null);
    reportRepository.userFindById = () => makePopulateLeanChain(null);
    reportRepository.messageFindById = () => makePopulateLeanChain(null);

    await assert.rejects(
      ReportService.createReport(REPORTER_ID, 'post', 'missing-post', { reason: 'spam' }),
      err => err?.statusCode === 404
    );
    await assert.rejects(
      ReportService.createReport(REPORTER_ID, 'comment', 'missing-comment', {
        reason: 'spam',
      }),
      err => err?.statusCode === 404
    );
    await assert.rejects(
      ReportService.createReport(REPORTER_ID, 'user', 'missing-user', { reason: 'spam' }),
      err => err?.statusCode === 404
    );
    await assert.rejects(
      ReportService.createReport(REPORTER_ID, 'message', 'missing-message', {
        reason: 'spam',
      }),
      err => err?.statusCode === 404
    );
  });

  it('reportPost/reportComment/reportUser/reportMessage should delegate to createReport', async () => {
    const originalCreateReport = ReportService.createReport;
    const calls = [];

    ReportService.createReport = async (...args) => {
      calls.push(args);
      return { _id: 'delegated' };
    };

    try {
      await ReportService.reportPost(REPORTER_ID, 'p1', { reason: 'spam' });
      await ReportService.reportComment(REPORTER_ID, 'c1', { reason: 'spam' });
      await ReportService.reportUser(REPORTER_ID, 'u1', { reason: 'spam' });
      await ReportService.reportMessage(REPORTER_ID, 'm1', { reason: 'spam' });
    } finally {
      ReportService.createReport = originalCreateReport;
    }

    assert.equal(calls[0][1], 'post');
    assert.equal(calls[1][1], 'comment');
    assert.equal(calls[2][1], 'user');
    assert.equal(calls[3][1], 'message');
  });

  it('getReportById should throw not found when report does not exist', async () => {
    reportRepository.reportFindById = () => makePopulateLeanChain(null);

    await assert.rejects(
      ReportService.getReportById('missing-id'),
      err => err?.statusCode === 404
    );
  });

  it('getReportById should return populated report when found', async () => {
    reportRepository.reportFindById = () =>
      makePopulateLeanChain({
        _id: 'report-found',
        reporter: { _id: REPORTER_ID },
      });

    const result = await ReportService.getReportById('report-found');
    assert.equal(result._id, 'report-found');
  });

  it('getUserReports should normalize status and compute hasMore', async () => {
    let queryFromFind;
    let queryFromCount;
    reportRepository.reportFind = query => {
      queryFromFind = query;
      return makePopulateLeanChain([{ _id: 'r1' }]);
    };
    reportRepository.reportCountDocuments = async query => {
      queryFromCount = query;
      return 11;
    };

    const result = await ReportService.getUserReports(REPORTER_ID, {
      page: 2,
      limit: 5,
      status: 'dismissed',
    });

    assert.equal(queryFromFind.status, 'rejected');
    assert.equal(queryFromCount.status, 'rejected');
    assert.equal(result.total, 11);
    assert.equal(result.hasMore, true);
  });

  it('getReportsAgainstUser should normalize status and page metadata', async () => {
    let queryFromFind;
    reportRepository.reportFind = query => {
      queryFromFind = query;
      return makePopulateLeanChain([{ _id: 'r-against' }]);
    };
    reportRepository.reportCountDocuments = async () => 2;

    const result = await ReportService.getReportsAgainstUser(TARGET_ID, {
      page: 1,
      limit: 2,
      status: 'in_review',
    });

    assert.equal(queryFromFind.targetUser, TARGET_ID);
    assert.equal(queryFromFind.status, 'reviewing');
    assert.equal(result.hasMore, false);
  });

  it('getAllReports should map filters including numeric priority and oldest sort', async () => {
    let queryFromFind;
    let queryFromCount;
    let sortArg;
    let skipArg;
    let limitArg;

    reportRepository.reportFind = query => {
      queryFromFind = query;
      return {
        populate() {
          return this;
        },
        sort(arg) {
          sortArg = arg;
          return this;
        },
        skip(arg) {
          skipArg = arg;
          return this;
        },
        limit(arg) {
          limitArg = arg;
          return this;
        },
        lean: async () => [{ _id: 'r2' }],
      };
    };
    reportRepository.reportCountDocuments = async query => {
      queryFromCount = query;
      return 30;
    };

    const result = await ReportService.getAllReports({
      page: 3,
      limit: 10,
      status: 'dismissed',
      category: 'spam',
      targetType: 'post',
      priority: '2',
      sort: 'oldest',
    });

    assert.equal(queryFromFind.status, 'rejected');
    assert.equal(queryFromFind.category, 'spam');
    assert.equal(queryFromFind.targetType, 'post');
    assert.equal(queryFromFind.priority, 2);
    assert.equal(queryFromCount.priority, 2);
    assert.deepEqual(sortArg, { createdAt: 1 });
    assert.equal(skipArg, 20);
    assert.equal(limitArg, 10);
    assert.equal(result.hasMore, false);
  });

  it('getPendingReports should delegate to getAllReports with pending status', async () => {
    const originalGetAllReports = ReportService.getAllReports;
    let receivedOptions;

    ReportService.getAllReports = async options => {
      receivedOptions = options;
      return { reports: [], total: 0, hasMore: false };
    };

    try {
      await ReportService.getPendingReports({ page: 2, limit: 5, category: 'spam' });

      assert.deepEqual(receivedOptions, {
        page: 2,
        limit: 5,
        status: 'pending',
        category: 'spam',
        targetType: undefined,
        priority: undefined,
      });
    } finally {
      ReportService.getAllReports = originalGetAllReports;
    }
  });

  it('startReview should throw when report does not exist', async () => {
    reportRepository.reportFindByIdAndUpdate = async () => null;

    await assert.rejects(
      ReportService.startReview('missing', ADMIN_ID),
      err => err?.statusCode === 404
    );
  });

  it('startReview should return updated report for valid id', async () => {
    reportRepository.reportFindByIdAndUpdate = async () => ({
      _id: 'report-1',
      status: 'reviewing',
    });

    const result = await ReportService.startReview('report-1', ADMIN_ID);
    assert.equal(result.status, 'reviewing');
  });

  it('resolveReport should validate decision and actionTaken constraints', async () => {
    await assert.rejects(
      ReportService.resolveReport(REPORTER_ID, ADMIN_ID, { decision: 'invalid' }),
      err => err?.statusCode === 400
    );

    await assert.rejects(
      ReportService.resolveReport(REPORTER_ID, ADMIN_ID, { decision: 'resolved' }),
      err => err?.statusCode === 400
    );
  });

  it('resolveReport should resolve transaction, execute action and notify reporter', async () => {
    let committed = false;
    let ended = false;
    let notificationCalls = 0;
    let executedAction;

    const fakeSession = {
      startTransaction() {},
      commitTransaction: async () => {
        committed = true;
      },
      abortTransaction: async () => {},
      endSession() {
        ended = true;
      },
    };

    mongoose.startSession = async () => fakeSession;
    reportRepository.reportFindByIdAndUpdate = () =>
      makePopulateThenable({
        _id: 'report-id',
        reporter: { _id: REPORTER_ID },
        targetUser: TARGET_ID,
      });
    ReportService._executeAction = async (_report, action) => {
      executedAction = action;
    };
    NotificationModel.create = async () => {
      notificationCalls += 1;
    };

    const result = await ReportService.resolveReport('report-id', ADMIN_ID, {
      decision: 'resolved',
      actionTaken: 'warn_user',
      notes: 'handled',
    });

    assert.equal(result._id, 'report-id');
    assert.equal(executedAction, 'warn_user');
    assert.equal(notificationCalls, 1);
    assert.equal(committed, true);
    assert.equal(ended, true);
  });

  it('resolveReport should abort transaction when report is missing', async () => {
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
    reportRepository.reportFindByIdAndUpdate = () => makePopulateThenable(null);

    await assert.rejects(
      ReportService.resolveReport('missing-id', ADMIN_ID, { decision: 'dismissed' }),
      err => err?.statusCode === 404
    );
    assert.equal(aborted, true);
  });

  it('resolveReport should normalize dismissed to rejected and skip reporter notification when reporter is missing', async () => {
    let committed = false;
    let executeActionCalls = 0;
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
    reportRepository.reportFindByIdAndUpdate = () =>
      makePopulateThenable({
        _id: 'report-dismissed',
        reporter: null,
        targetUser: TARGET_ID,
      });
    ReportService._executeAction = async () => {
      executeActionCalls += 1;
    };
    NotificationModel.create = async () => {
      notificationCalls += 1;
    };

    const result = await ReportService.resolveReport('report-dismissed', ADMIN_ID, {
      decision: 'dismissed',
      notes: 'no issue',
    });

    assert.equal(result._id, 'report-dismissed');
    assert.equal(executeActionCalls, 0);
    assert.equal(notificationCalls, 0);
    assert.equal(committed, true);
  });

  it('resolveReport should fallback resolution action for unknown resolved actionTaken', async () => {
    let updateDoc;
    const fakeSession = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession() {},
    };

    mongoose.startSession = async () => fakeSession;
    reportRepository.reportFindByIdAndUpdate = (_id, update) => {
      updateDoc = update;
      return makePopulateThenable({
        _id: 'report-fallback',
        reporter: REPORTER_ID,
        targetUser: TARGET_ID,
      });
    };
    ReportService._executeAction = async () => {};
    NotificationModel.create = async () => {};

    await ReportService.resolveReport('report-fallback', ADMIN_ID, {
      decision: 'resolved',
      actionTaken: 'unknown_action',
    });

    assert.equal(updateDoc.$set.resolution.action, 'content_removed');
  });

  it('updateReportStatus should validate allowed statuses', async () => {
    await assert.rejects(
      ReportService.updateReportStatus(REPORTER_ID, ADMIN_ID, {
        status: 'unknown-status',
      }),
      err => err?.statusCode === 400
    );
  });

  it('updateReportStatus should normalize dismissed to rejected and persist resolution', async () => {
    let updateDoc;
    reportRepository.reportFindByIdAndUpdate = (_id, update) => {
      updateDoc = update;
      return makePopulateThenable({ _id: 'report-id', status: 'rejected' });
    };

    const result = await ReportService.updateReportStatus('report-id', ADMIN_ID, {
      status: 'dismissed',
      notes: 'no violation',
    });

    assert.equal(updateDoc.$set.status, 'rejected');
    assert.equal(updateDoc.$set.resolution.action, 'no_violation');
    assert.equal(updateDoc.$set.resolution.note, 'no violation');
    assert.equal(result.status, 'rejected');
  });

  it('updateReportStatus should throw not found when report id is missing', async () => {
    reportRepository.reportFindByIdAndUpdate = () => makePopulateThenable(null);

    await assert.rejects(
      ReportService.updateReportStatus('missing-id', ADMIN_ID, {
        status: 'pending',
      }),
      err => err?.statusCode === 404
    );
  });

  it('updateReportStatus should avoid resolution block for resolved status without notes', async () => {
    let updateDoc;
    reportRepository.reportFindByIdAndUpdate = (_id, update) => {
      updateDoc = update;
      return makePopulateThenable({ _id: 'report-no-resolution', status: 'resolved' });
    };

    const result = await ReportService.updateReportStatus(
      'report-no-resolution',
      ADMIN_ID,
      { status: 'resolved' }
    );

    assert.equal(updateDoc.$set.status, 'resolved');
    assert.equal(updateDoc.$set.resolution, undefined);
    assert.equal(result.status, 'resolved');
  });

  it('_executeAction should warn target user and create moderation notification', async () => {
    let updatedUserQuery;
    let notificationCalls = 0;
    reportRepository.userFindByIdAndUpdate = async (id, query) => {
      updatedUserQuery = query;
      return { _id: id };
    };
    NotificationModel.create = async () => {
      notificationCalls += 1;
    };

    await ReportService._executeAction(
      { targetUser: TARGET_ID, reason: 'spam content' },
      'warn_user',
      ADMIN_ID,
      {}
    );

    assert.equal(updatedUserQuery.$inc['moderation.warnings'], 1);
    assert.equal(notificationCalls, 1);
  });

  it('_executeAction should remove post, decrement count and notify owner', async () => {
    let postUpdated = false;
    let userCountUpdated = false;
    let notificationCalls = 0;

    reportRepository.postFindById = () => ({
      select() {
        return this;
      },
      session: async () => ({
        isDeleted: false,
        user: TARGET_ID,
      }),
    });
    reportRepository.postFindByIdAndUpdate = () => ({
      session: async () => {
        postUpdated = true;
      },
    });
    reportRepository.userFindByIdAndUpdate = () => ({
      session: async () => {
        userCountUpdated = true;
      },
    });
    NotificationModel.create = async () => {
      notificationCalls += 1;
    };

    await ReportService._executeAction(
      { targetType: 'post', targetId: 'post-2', reason: 'violence' },
      'remove_content',
      ADMIN_ID,
      {}
    );

    assert.equal(postUpdated, true);
    assert.equal(userCountUpdated, true);
    assert.equal(notificationCalls, 1);
  });

  it('_executeAction should remove comment and decrement post comments count', async () => {
    let commentUpdated = false;
    let postCountUpdated = false;
    let notificationCalls = 0;

    reportRepository.commentFindById = () => ({
      select() {
        return this;
      },
      session: async () => ({
        isDeleted: false,
        post: 'post-3',
        user: TARGET_ID,
      }),
    });
    reportRepository.commentFindByIdAndUpdate = () => ({
      session: async () => {
        commentUpdated = true;
      },
    });
    reportRepository.postFindByIdAndUpdate = () => ({
      session: async () => {
        postCountUpdated = true;
      },
    });
    NotificationModel.create = async () => {
      notificationCalls += 1;
    };

    await ReportService._executeAction(
      { targetType: 'comment', targetId: 'comment-3', reason: 'hate_speech' },
      'remove_content',
      ADMIN_ID,
      {}
    );

    assert.equal(commentUpdated, true);
    assert.equal(postCountUpdated, true);
    assert.equal(notificationCalls, 1);
  });

  it('_executeAction should suspend and ban target user with token revocation', async () => {
    let refreshUpdateCallCount = 0;
    let lastRevokedReason;
    let notificationCalls = 0;
    reportRepository.userFindByIdAndUpdate = async () => ({ _id: TARGET_ID });
    reportRepository.refreshTokenUpdateMany = async (_query, update) => {
      refreshUpdateCallCount += 1;
      lastRevokedReason = update.revokedReason;
    };
    NotificationModel.create = async () => {
      notificationCalls += 1;
    };

    await ReportService._executeAction(
      { targetUser: TARGET_ID, reason: 'repeat violation' },
      'suspend_user',
      ADMIN_ID,
      {}
    );
    await ReportService._executeAction(
      { targetUser: TARGET_ID, reason: 'severe violation' },
      'ban_user',
      ADMIN_ID,
      {}
    );

    assert.equal(refreshUpdateCallCount, 2);
    assert.equal(lastRevokedReason, 'user_banned');
    assert.equal(notificationCalls, 2);
  });

  it('_executeAction should no-op for missing target users on warn/suspend/ban actions', async () => {
    let userUpdateCalls = 0;
    let refreshUpdateCalls = 0;
    let notificationCalls = 0;
    reportRepository.userFindByIdAndUpdate = async () => {
      userUpdateCalls += 1;
      return null;
    };
    reportRepository.refreshTokenUpdateMany = async () => {
      refreshUpdateCalls += 1;
    };
    NotificationModel.create = async () => {
      notificationCalls += 1;
    };

    await ReportService._executeAction({ reason: 'none' }, 'warn_user', ADMIN_ID, {});
    await ReportService._executeAction({ reason: 'none' }, 'suspend_user', ADMIN_ID, {});
    await ReportService._executeAction({ reason: 'none' }, 'ban_user', ADMIN_ID, {});

    assert.equal(userUpdateCalls, 0);
    assert.equal(refreshUpdateCalls, 0);
    assert.equal(notificationCalls, 0);
  });

  it('_executeAction should skip warn notification when user update returns null', async () => {
    let notificationCalls = 0;
    reportRepository.userFindByIdAndUpdate = async () => null;
    NotificationModel.create = async () => {
      notificationCalls += 1;
    };

    await ReportService._executeAction(
      { targetUser: TARGET_ID, reason: 'warn reason' },
      'warn_user',
      ADMIN_ID,
      {}
    );

    assert.equal(notificationCalls, 0);
  });

  it('_executeAction should skip follow-up updates when removed content is already deleted or missing post link', async () => {
    let userCountUpdates = 0;
    const postUpdatePayloads = [];
    let notificationCalls = 0;

    reportRepository.postFindById = () => ({
      select() {
        return this;
      },
      session: async () => ({
        isDeleted: true,
        user: TARGET_ID,
      }),
    });
    reportRepository.postFindByIdAndUpdate = (_id, update) => ({
      session: async () => {
        postUpdatePayloads.push(update);
      },
    });
    reportRepository.commentFindById = () => ({
      select() {
        return this;
      },
      session: async () => ({
        isDeleted: false,
        post: null,
        user: TARGET_ID,
      }),
    });
    reportRepository.commentFindByIdAndUpdate = () => ({
      session: async () => {},
    });
    reportRepository.userFindByIdAndUpdate = () => ({
      session: async () => {
        userCountUpdates += 1;
      },
    });
    NotificationModel.create = async () => {
      notificationCalls += 1;
    };

    await ReportService._executeAction(
      { targetType: 'post', targetId: 'post-archived', reason: 'old' },
      'remove_content',
      ADMIN_ID,
      {}
    );
    await ReportService._executeAction(
      { targetType: 'comment', targetId: 'comment-nopost', reason: 'old' },
      'remove_content',
      ADMIN_ID,
      {}
    );

    assert.equal(userCountUpdates, 0);
    assert.equal(postUpdatePayloads.length, 1);
    assert.equal(Boolean(postUpdatePayloads.find(update => update.$inc)), false);
    assert.equal(notificationCalls, 0);
  });

  it('_executeAction should warn on unknown action', async () => {
    let warningMessage;
    logger.warn = message => {
      warningMessage = message;
    };

    await ReportService._executeAction(
      { targetType: 'post', targetId: 'p1' },
      'unknown-action',
      ADMIN_ID,
      {}
    );

    assert.match(warningMessage, /Unknown action/);
  });
});

