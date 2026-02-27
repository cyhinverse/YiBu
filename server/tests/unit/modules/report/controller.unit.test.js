import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import ReportController from '../../../../src/modules/report/report.controller.js';
import ReportService from '../../../../src/modules/report/report.service.js';
import {
  createMockResponse,
  runMiddleware,
} from '../../../shared/middlewareTestUtils.js';

const TEST_USER_ID = '507f191e810c19729de860ea';
const TEST_ADMIN_ID = '507f191e810c19729de860eb';

describe('ReportController', () => {
  it('createReport should validate required target fields', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      body: { reason: 'spam' },
    };
    const res = createMockResponse();

    const error = await runMiddleware(ReportController.createReport, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Target type and target ID are required');
  });

  it('createReport should validate reason', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      body: { targetType: 'post', targetId: '507f191e810c19729de860ec' },
    };
    const res = createMockResponse();

    const error = await runMiddleware(ReportController.createReport, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Reason is required');
  });

  it('createReport should delegate to service with payload', async () => {
    const originalCreateReport = ReportService.createReport;
    let receivedArgs;

    ReportService.createReport = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860ee' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: {
          targetType: 'post',
          targetId: '507f191e810c19729de860ec',
          category: 'spam',
          reason: 'spam links',
          description: 'desc',
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(ReportController.createReport, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        TEST_USER_ID,
        'post',
        '507f191e810c19729de860ec',
        {
          category: 'spam',
          reason: 'spam links',
          description: 'desc',
        },
      ]);
      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonPayload.message, 'Report submitted successfully');
    } finally {
      ReportService.createReport = originalCreateReport;
    }
  });

  it('reportPost should delegate payload to service', async () => {
    const originalReportPost = ReportService.reportPost;
    let receivedArgs;

    ReportService.reportPost = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860ed' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { postId: '507f191e810c19729de860ec' },
        body: { category: 'spam', reason: 'spam links', description: 'desc' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(ReportController.reportPost, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        TEST_USER_ID,
        '507f191e810c19729de860ec',
        { category: 'spam', reason: 'spam links', description: 'desc' },
      ]);
      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonPayload.message, 'Post reported successfully');
    } finally {
      ReportService.reportPost = originalReportPost;
    }
  });

  it('reportPost should require reason', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      params: { postId: '507f191e810c19729de860ec' },
      body: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(ReportController.reportPost, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Reason is required');
  });

  it('reportComment should delegate payload to service', async () => {
    const originalReportComment = ReportService.reportComment;
    let receivedArgs;

    ReportService.reportComment = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860ed' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { commentId: '507f191e810c19729de860ec' },
        body: { category: 'abuse', reason: 'abusive comment', description: 'desc' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(ReportController.reportComment, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        TEST_USER_ID,
        '507f191e810c19729de860ec',
        { category: 'abuse', reason: 'abusive comment', description: 'desc' },
      ]);
      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonPayload.message, 'Comment reported successfully');
    } finally {
      ReportService.reportComment = originalReportComment;
    }
  });

  it('reportComment should require reason', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      params: { commentId: '507f191e810c19729de860ec' },
      body: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(ReportController.reportComment, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Reason is required');
  });

  it('reportUser should delegate payload to service', async () => {
    const originalReportUser = ReportService.reportUser;
    let receivedArgs;

    ReportService.reportUser = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860ed' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { userId: '507f191e810c19729de860ec' },
        body: { category: 'fake', reason: 'fake profile', description: 'desc' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(ReportController.reportUser, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        TEST_USER_ID,
        '507f191e810c19729de860ec',
        { category: 'fake', reason: 'fake profile', description: 'desc' },
      ]);
      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonPayload.message, 'User reported successfully');
    } finally {
      ReportService.reportUser = originalReportUser;
    }
  });

  it('reportUser should require reason', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      params: { userId: '507f191e810c19729de860ec' },
      body: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(ReportController.reportUser, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Reason is required');
  });

  it('reportMessage should delegate payload to service', async () => {
    const originalReportMessage = ReportService.reportMessage;
    let receivedArgs;

    ReportService.reportMessage = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860ed' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { messageId: '507f191e810c19729de860ec' },
        body: { category: 'abuse', reason: 'abusive message', description: 'desc' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(ReportController.reportMessage, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        TEST_USER_ID,
        '507f191e810c19729de860ec',
        { category: 'abuse', reason: 'abusive message', description: 'desc' },
      ]);
      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonPayload.message, 'Message reported successfully');
    } finally {
      ReportService.reportMessage = originalReportMessage;
    }
  });

  it('reportMessage should require reason', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      params: { messageId: '507f191e810c19729de860ec' },
      body: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(ReportController.reportMessage, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Reason is required');
  });

  it('getReportById should forbid non-admin users from accessing other reports', async () => {
    const originalGetReportById = ReportService.getReportById;
    ReportService.getReportById = async () => ({
      _id: '507f191e810c19729de860ef',
      reporter: { _id: '507f191e810c19729de860ee' },
    });

    try {
      const req = {
        params: { reportId: '507f191e810c19729de860ef' },
        user: { id: TEST_USER_ID, isAdmin: false },
      };
      const res = createMockResponse();

      const error = await runMiddleware(ReportController.getReportById, req, res);

      assert.equal(error.statusCode, 403);
      assert.equal(error.message, 'Not authorized to view this report');
    } finally {
      ReportService.getReportById = originalGetReportById;
    }
  });

  it('getReportById should allow admin users', async () => {
    const originalGetReportById = ReportService.getReportById;
    ReportService.getReportById = async () => ({
      _id: '507f191e810c19729de860ef',
      reporter: { _id: TEST_USER_ID },
    });

    try {
      const req = {
        params: { reportId: '507f191e810c19729de860ef' },
        user: { id: TEST_ADMIN_ID, isAdmin: true },
      };
      const res = createMockResponse();

      const error = await runMiddleware(ReportController.getReportById, req, res);

      assert.equal(error, undefined);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.data._id, '507f191e810c19729de860ef');
    } finally {
      ReportService.getReportById = originalGetReportById;
    }
  });

  it('getReportById should allow reporter when reporter is stored as primitive id', async () => {
    const originalGetReportById = ReportService.getReportById;

    ReportService.getReportById = async () => ({
      _id: '507f191e810c19729de860ef',
      reporter: TEST_USER_ID,
    });

    try {
      const req = {
        params: { reportId: '507f191e810c19729de860ef' },
        user: { id: TEST_USER_ID, isAdmin: false },
      };
      const res = createMockResponse();

      const error = await runMiddleware(ReportController.getReportById, req, res);

      assert.equal(error, undefined);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.data._id, '507f191e810c19729de860ef');
    } finally {
      ReportService.getReportById = originalGetReportById;
    }
  });

  it('getMyReports should pass status and pagination to service', async () => {
    const originalGetUserReports = ReportService.getUserReports;
    let receivedArgs;

    ReportService.getUserReports = async (...args) => {
      receivedArgs = args;
      return { reports: [], total: 0, hasMore: false };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID, isAdmin: false },
        query: { page: '2', limit: '5', status: 'pending' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(ReportController.getMyReports, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        TEST_USER_ID,
        { page: 2, limit: 5, status: 'pending' },
      ]);
      assert.equal(res.statusCode, 200);
    } finally {
      ReportService.getUserReports = originalGetUserReports;
    }
  });

  it('getAllReports should require admin access', async () => {
    const req = {
      user: { id: TEST_USER_ID, isAdmin: false },
      query: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(ReportController.getAllReports, req, res);

    assert.equal(error.statusCode, 403);
    assert.equal(error.message, 'Admin access required');
  });

  it('getAllReports should delegate for admin users', async () => {
    const originalGetAllReports = ReportService.getAllReports;
    let receivedArgs;

    ReportService.getAllReports = async (...args) => {
      receivedArgs = args;
      return { reports: [], total: 0, hasMore: false };
    };

    try {
      const req = {
        user: { id: TEST_ADMIN_ID, isAdmin: true },
        query: {
          page: '2',
          limit: '5',
          status: 'pending',
          category: 'spam',
          targetType: 'post',
          priority: 'high',
          sort: 'createdAt',
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(ReportController.getAllReports, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        {
          page: 2,
          limit: 5,
          status: 'pending',
          category: 'spam',
          targetType: 'post',
          priority: 'high',
          sort: 'createdAt',
        },
      ]);
      assert.equal(res.statusCode, 200);
    } finally {
      ReportService.getAllReports = originalGetAllReports;
    }
  });

  it('getPendingReports should require admin access', async () => {
    const req = {
      user: { id: TEST_USER_ID, isAdmin: false },
      query: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(ReportController.getPendingReports, req, res);

    assert.equal(error.statusCode, 403);
    assert.equal(error.message, 'Admin access required');
  });

  it('getPendingReports should delegate for admin users', async () => {
    const originalGetPendingReports = ReportService.getPendingReports;
    let receivedArgs;

    ReportService.getPendingReports = async (...args) => {
      receivedArgs = args;
      return { reports: [], total: 0, hasMore: false };
    };

    try {
      const req = {
        user: { id: TEST_ADMIN_ID, isAdmin: true },
        query: {
          page: '1',
          limit: '4',
          category: 'abuse',
          targetType: 'user',
          priority: 'medium',
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(ReportController.getPendingReports, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        {
          page: 1,
          limit: 4,
          category: 'abuse',
          targetType: 'user',
          priority: 'medium',
        },
      ]);
      assert.equal(res.statusCode, 200);
    } finally {
      ReportService.getPendingReports = originalGetPendingReports;
    }
  });

  it('getReportsAgainstUser should delegate to service for admin users', async () => {
    const originalGetReportsAgainstUser = ReportService.getReportsAgainstUser;
    let receivedArgs;

    ReportService.getReportsAgainstUser = async (...args) => {
      receivedArgs = args;
      return { reports: [], total: 0, hasMore: false };
    };

    try {
      const req = {
        user: { id: TEST_ADMIN_ID, isAdmin: true },
        params: { userId: '507f191e810c19729de860ec' },
        query: { page: '3', limit: '4', status: 'reviewing' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        ReportController.getReportsAgainstUser,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        '507f191e810c19729de860ec',
        { page: 3, limit: 4, status: 'reviewing' },
      ]);
      assert.equal(res.statusCode, 200);
    } finally {
      ReportService.getReportsAgainstUser = originalGetReportsAgainstUser;
    }
  });

  it('getReportsAgainstUser should require admin access', async () => {
    const req = {
      user: { id: TEST_USER_ID, isAdmin: false },
      params: { userId: '507f191e810c19729de860ec' },
      query: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(
      ReportController.getReportsAgainstUser,
      req,
      res
    );

    assert.equal(error.statusCode, 403);
    assert.equal(error.message, 'Admin access required');
  });

  it('startReview should require admin access', async () => {
    const req = {
      user: { id: TEST_USER_ID, isAdmin: false },
      params: { reportId: '507f191e810c19729de860ef' },
    };
    const res = createMockResponse();

    const error = await runMiddleware(ReportController.startReview, req, res);

    assert.equal(error.statusCode, 403);
    assert.equal(error.message, 'Admin access required');
  });

  it('startReview should delegate to service for admin users', async () => {
    const originalStartReview = ReportService.startReview;
    let receivedArgs;

    ReportService.startReview = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860ef', status: 'reviewing' };
    };

    try {
      const req = {
        user: { id: TEST_ADMIN_ID, isAdmin: true },
        params: { reportId: '507f191e810c19729de860ef' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(ReportController.startReview, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, ['507f191e810c19729de860ef', TEST_ADMIN_ID]);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.message, 'Review started');
    } finally {
      ReportService.startReview = originalStartReview;
    }
  });

  it('resolveReport should map legacy action payload', async () => {
    const originalResolveReport = ReportService.resolveReport;
    let receivedArgs;

    ReportService.resolveReport = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860ef' };
    };

    try {
      const req = {
        params: { reportId: '507f191e810c19729de860ef' },
        user: { id: TEST_ADMIN_ID, isAdmin: true },
        body: { action: 'warn', notes: 'first warning' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(ReportController.resolveReport, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        '507f191e810c19729de860ef',
        TEST_ADMIN_ID,
        { decision: 'resolved', actionTaken: 'warn_user', notes: 'first warning' },
      ]);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.message, 'Report resolved');
    } finally {
      ReportService.resolveReport = originalResolveReport;
    }
  });

  it('resolveReport should require admin access', async () => {
    const req = {
      params: { reportId: '507f191e810c19729de860ef' },
      user: { id: TEST_USER_ID, isAdmin: false },
      body: { decision: 'resolved' },
    };
    const res = createMockResponse();

    const error = await runMiddleware(ReportController.resolveReport, req, res);

    assert.equal(error.statusCode, 403);
    assert.equal(error.message, 'Admin access required');
  });

  it('resolveReport should reject empty resolution payload', async () => {
    const req = {
      params: { reportId: '507f191e810c19729de860ef' },
      user: { id: TEST_ADMIN_ID, isAdmin: true },
      body: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(ReportController.resolveReport, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Resolution input is required');
  });

  it('resolveReport should map legacy resolution payload', async () => {
    const originalResolveReport = ReportService.resolveReport;
    let receivedArgs;

    ReportService.resolveReport = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860ef' };
    };

    try {
      const req = {
        params: { reportId: '507f191e810c19729de860ef' },
        user: { id: TEST_ADMIN_ID, isAdmin: true },
        body: { resolution: 'dismissed', notes: 'no violation' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(ReportController.resolveReport, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        '507f191e810c19729de860ef',
        TEST_ADMIN_ID,
        { decision: 'rejected', actionTaken: null, notes: 'no violation' },
      ]);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.message, 'Report rejected');
    } finally {
      ReportService.resolveReport = originalResolveReport;
    }
  });

  it('resolveReport should keep explicit decision and normalize missing actionTaken to null', async () => {
    const originalResolveReport = ReportService.resolveReport;
    let receivedArgs;

    ReportService.resolveReport = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860ef' };
    };

    try {
      const req = {
        params: { reportId: '507f191e810c19729de860ef' },
        user: { id: TEST_ADMIN_ID, isAdmin: true },
        body: { decision: 'resolved', notes: 'handled manually' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(ReportController.resolveReport, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        '507f191e810c19729de860ef',
        TEST_ADMIN_ID,
        { decision: 'resolved', actionTaken: null, notes: 'handled manually' },
      ]);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.message, 'Report resolved');
    } finally {
      ReportService.resolveReport = originalResolveReport;
    }
  });

  it('resolveReport should map actionTaken-only payload to resolved decision', async () => {
    const originalResolveReport = ReportService.resolveReport;
    let receivedArgs;

    ReportService.resolveReport = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860ef' };
    };

    try {
      const req = {
        params: { reportId: '507f191e810c19729de860ef' },
        user: { id: TEST_ADMIN_ID, isAdmin: true },
        body: { actionTaken: 'remove_content', notes: 'content removed' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(ReportController.resolveReport, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        '507f191e810c19729de860ef',
        TEST_ADMIN_ID,
        {
          decision: 'resolved',
          actionTaken: 'remove_content',
          notes: 'content removed',
        },
      ]);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.message, 'Report resolved');
    } finally {
      ReportService.resolveReport = originalResolveReport;
    }
  });

  it('updateReportStatus should delegate status update to service', async () => {
    const originalUpdateReportStatus = ReportService.updateReportStatus;
    let receivedArgs;

    ReportService.updateReportStatus = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860ef', status: 'reviewing' };
    };

    try {
      const req = {
        params: { reportId: '507f191e810c19729de860ef' },
        user: { id: TEST_ADMIN_ID, isAdmin: true },
        body: { status: 'reviewing', notes: 'checking evidence' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        ReportController.updateReportStatus,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        '507f191e810c19729de860ef',
        TEST_ADMIN_ID,
        { status: 'reviewing', notes: 'checking evidence' },
      ]);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.message, 'Report status updated to reviewing');
    } finally {
      ReportService.updateReportStatus = originalUpdateReportStatus;
    }
  });

  it('updateReportStatus should require admin access', async () => {
    const req = {
      params: { reportId: '507f191e810c19729de860ef' },
      user: { id: TEST_USER_ID, isAdmin: false },
      body: { status: 'reviewing' },
    };
    const res = createMockResponse();

    const error = await runMiddleware(
      ReportController.updateReportStatus,
      req,
      res
    );

    assert.equal(error.statusCode, 403);
    assert.equal(error.message, 'Admin access required');
  });
});

