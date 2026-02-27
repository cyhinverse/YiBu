import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AdminController } from '../../../../src/modules/admin/admin.controller.js';
import AdminService from '../../../../src/modules/admin/admin.service.js';
import UserService from '../../../../src/modules/user/user.service.js';
import {
  createMockResponse,
  runMiddleware,
} from '../../../shared/middlewareTestUtils.js';

describe('AdminController', () => {
  const VALID_ID = '507f191e810c19729de860ea';
  const ADMIN_ID = '507f191e810c19729de860eb';

  it('getDashboardStats/getUserGrowthStats/getPostStats/getTopEngagedUsers should delegate with normalized params', async () => {
    const originalGetDashboardStats = AdminService.getDashboardStats;
    const originalGetUserGrowthStats = AdminService.getUserGrowthStats;
    const originalGetPostStats = AdminService.getPostStats;
    const originalGetTopEngagedUsers = AdminService.getTopEngagedUsers;
    const received = {};

    AdminService.getDashboardStats = async () => ({ users: 1 });
    AdminService.getUserGrowthStats = async days => {
      received.userGrowthDays = days;
      return [{ day: 1 }];
    };
    AdminService.getPostStats = async days => {
      received.postStatsDays = days;
      return [{ day: 1 }];
    };
    AdminService.getTopEngagedUsers = async limit => {
      received.topLimit = limit;
      return [];
    };

    try {
      {
        const req = { query: {} };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getDashboardStats, req, res);
        assert.equal(error, undefined);
        assert.equal(res.statusCode, 200);
      }

      {
        const req = { query: { days: '14' } };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getUserGrowthStats, req, res);
        assert.equal(error, undefined);
      }

      {
        const req = { query: {} };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getPostStats, req, res);
        assert.equal(error, undefined);
      }

      {
        const req = { query: { limit: '15' } };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getTopEngagedUsers, req, res);
        assert.equal(error, undefined);
      }

      assert.equal(received.userGrowthDays, 14);
      assert.equal(received.postStatsDays, 30);
      assert.equal(received.topLimit, 15);
    } finally {
      AdminService.getDashboardStats = originalGetDashboardStats;
      AdminService.getUserGrowthStats = originalGetUserGrowthStats;
      AdminService.getPostStats = originalGetPostStats;
      AdminService.getTopEngagedUsers = originalGetTopEngagedUsers;
    }
  });

  it('getInteractions should pass pagination/type/search and shape response', async () => {
    const originalGetInteractions = AdminService.getInteractions;
    let receivedFilter;

    AdminService.getInteractions = async filter => {
      receivedFilter = filter;
      return {
        interactions: [{ id: 1 }],
        stats: { total: 1 },
        total: 1,
        page: 2,
        totalPages: 1,
        hasMore: false,
      };
    };

    try {
      const req = {
        query: { page: '2', limit: '5', type: 'follow', search: 'abc' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(AdminController.getInteractions, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedFilter.page, 2);
      assert.equal(receivedFilter.limit, 5);
      assert.equal(receivedFilter.type, 'follow');
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.data.pagination.total, 1);
    } finally {
      AdminService.getInteractions = originalGetInteractions;
    }
  });

  it('getAllUsers should normalize lastLogin sort key and sort order', async () => {
    const originalGetAllUsers = AdminService.getAllUsers;
    let receivedFilter;

    AdminService.getAllUsers = async filter => {
      receivedFilter = filter;
      return {
        users: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasMore: false,
      };
    };

    try {
      const req = {
        query: { page: '1', limit: '10', sortBy: 'lastLogin', sortOrder: 'asc' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(AdminController.getAllUsers, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedFilter.sortBy, 'lastLoginAt');
      assert.equal(receivedFilter.sortOrder, 1);
      assert.equal(res.statusCode, 200);
    } finally {
      AdminService.getAllUsers = originalGetAllUsers;
    }
  });

  it('getReports should normalize status/type/priority fields', async () => {
    const originalGetReports = AdminService.getReports;
    let receivedFilter;

    AdminService.getReports = async filter => {
      receivedFilter = filter;
      return {
        reports: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasMore: false,
      };
    };

    try {
      const req = {
        query: {
          status: 'in_review',
          type: 'post',
          priority: 'high',
          sortOrder: 'desc',
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(AdminController.getReports, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedFilter.status, 'reviewing');
      assert.equal(receivedFilter.targetType, 'post');
      assert.equal(receivedFilter.priority, 60);
      assert.equal(receivedFilter.sortOrder, -1);
    } finally {
      AdminService.getReports = originalGetReports;
    }
  });

  it('suspendUser should map duration alias to service days parameter', async () => {
    const originalSuspendUser = AdminService.suspendUser;
    let receivedArgs;

    AdminService.suspendUser = async (...args) => {
      receivedArgs = args;
      return { id: args[0], status: 'suspended' };
    };

    try {
      const req = {
        body: {
          userId: '507f191e810c19729de860ea',
          duration: 14,
          reason: 'policy violation',
        },
        user: { id: '507f191e810c19729de860eb' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(AdminController.suspendUser, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedArgs[2], 14);
      assert.equal(receivedArgs[3], 'policy violation');
    } finally {
      AdminService.suspendUser = originalSuspendUser;
    }
  });

  it('moderatePost should return bad request when action is missing', async () => {
    const req = {
      params: { postId: '507f191e810c19729de860ea' },
      body: {},
      user: { id: '507f191e810c19729de860eb' },
    };
    const res = createMockResponse();

    const error = await runMiddleware(AdminController.moderatePost, req, res);

    assert.equal(error.statusCode, 400);
  });

  it('broadcastNotification should build final content from title + message', async () => {
    const originalBroadcastNotification = AdminService.broadcastNotification;
    let receivedPayload;

    AdminService.broadcastNotification = async (_adminId, payload) => {
      receivedPayload = payload;
      return { sentCount: 1 };
    };

    try {
      const req = {
        body: {
          title: 'System',
          message: 'Maintenance tonight',
          targetAudience: 'active',
        },
        user: { id: '507f191e810c19729de860eb' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        AdminController.broadcastNotification,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.equal(receivedPayload.content, 'System: Maintenance tonight');
      assert.equal(receivedPayload.targetGroup, 'active');
      assert.equal(receivedPayload.type, 'system');
      assert.equal(res.statusCode, 200);
    } finally {
      AdminService.broadcastNotification = originalBroadcastNotification;
    }
  });

  it('getUserDetails should reject invalid id and return user for valid id', async () => {
    const originalGetUserById = AdminService.getUserById;
    let receivedUserId;

    AdminService.getUserById = async userId => {
      receivedUserId = userId;
      return { id: userId };
    };

    try {
      {
        const req = { params: { userId: 'bad-id' } };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getUserDetails, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = { params: { userId: VALID_ID } };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getUserDetails, req, res);
        assert.equal(error, undefined);
        assert.equal(res.statusCode, 200);
      }

      assert.equal(receivedUserId, VALID_ID);
    } finally {
      AdminService.getUserById = originalGetUserById;
    }
  });

  it('getUserPosts/getUserReports should validate userId and delegate with pagination', async () => {
    const originalGetUserPosts = AdminService.getUserPosts;
    const originalGetUserReports = AdminService.getUserReports;
    const calls = {};

    AdminService.getUserPosts = async (userId, options) => {
      calls.userPosts = { userId, options };
      return { posts: [] };
    };

    AdminService.getUserReports = async (userId, options) => {
      calls.userReports = { userId, options };
      return { reports: [] };
    };

    try {
      {
        const req = { params: { userId: 'bad-id' }, query: {} };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getUserPosts, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = {
          params: { userId: VALID_ID },
          query: { page: '2', limit: '3' },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getUserPosts, req, res);
        assert.equal(error, undefined);
      }

      {
        const req = { params: { userId: 'bad-id' }, query: {} };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getUserReports, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = {
          params: { userId: VALID_ID },
          query: { page: '1', limit: '2' },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getUserReports, req, res);
        assert.equal(error, undefined);
      }

      assert.equal(calls.userPosts.userId, VALID_ID);
      assert.equal(calls.userPosts.options.page, 2);
      assert.equal(calls.userReports.options.limit, 2);
    } finally {
      AdminService.getUserPosts = originalGetUserPosts;
      AdminService.getUserReports = originalGetUserReports;
    }
  });

  it('updateUser should validate id and pass admin id + payload to service', async () => {
    const originalUpdateUser = AdminService.updateUser;
    let receivedArgs;

    AdminService.updateUser = async (...args) => {
      receivedArgs = args;
      return { id: args[0], name: 'updated' };
    };

    try {
      {
        const req = {
          params: { userId: 'bad-id' },
          body: { name: 'new name' },
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.updateUser, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = {
          params: { userId: VALID_ID },
          body: { name: 'new name' },
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.updateUser, req, res);
        assert.equal(error, undefined);
        assert.equal(res.statusCode, 200);
      }

      assert.deepEqual(receivedArgs, [VALID_ID, { name: 'new name' }, ADMIN_ID]);
    } finally {
      AdminService.updateUser = originalUpdateUser;
    }
  });

  it('banUser/unbanUser/warnUser should validate input and delegate', async () => {
    const originalBanUser = AdminService.banUser;
    const originalUnbanUser = AdminService.unbanUser;
    const originalWarnUser = AdminService.warnUser;
    const calls = {};

    AdminService.banUser = async (...args) => {
      calls.ban = args;
      return { id: args[0], status: 'banned' };
    };
    AdminService.unbanUser = async (...args) => {
      calls.unban = args;
      return { id: args[0], status: 'active' };
    };
    AdminService.warnUser = async (...args) => {
      calls.warn = args;
      return { id: args[0], warned: true };
    };

    try {
      {
        const req = { body: { userId: 'bad-id' }, user: { id: ADMIN_ID } };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.banUser, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = { body: { userId: VALID_ID }, user: { id: ADMIN_ID } };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.unbanUser, req, res);
        assert.equal(error, undefined);
      }

      {
        const req = { body: { userId: VALID_ID }, user: { id: ADMIN_ID } };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.warnUser, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = {
          body: { userId: VALID_ID, reason: 'policy violation' },
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.warnUser, req, res);
        assert.equal(error, undefined);
      }

      {
        const req = {
          body: { userId: VALID_ID, reason: 'spam' },
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.banUser, req, res);
        assert.equal(error, undefined);
      }

      assert.deepEqual(calls.unban, [VALID_ID, ADMIN_ID]);
      assert.deepEqual(calls.warn, [VALID_ID, ADMIN_ID, 'policy violation']);
      assert.deepEqual(calls.ban, [VALID_ID, ADMIN_ID, 'spam']);
    } finally {
      AdminService.banUser = originalBanUser;
      AdminService.unbanUser = originalUnbanUser;
      AdminService.warnUser = originalWarnUser;
    }
  });

  it('getBannedUsers/getAllPosts/getAllComments should normalize filters and pagination', async () => {
    const originalGetAllUsers = AdminService.getAllUsers;
    const originalGetAllPosts = AdminService.getAllPosts;
    const originalGetAllComments = AdminService.getAllComments;
    const calls = {};

    AdminService.getAllUsers = async filter => {
      calls.users = filter;
      return { users: [], total: 0, page: 1, totalPages: 0, hasMore: false };
    };
    AdminService.getAllPosts = async filter => {
      calls.posts = filter;
      return { posts: [], total: 0, page: 1, totalPages: 0, hasMore: false };
    };
    AdminService.getAllComments = async filter => {
      calls.comments = filter;
      return {
        comments: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasMore: false,
      };
    };

    try {
      {
        const req = { query: { page: '3', limit: '4' } };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getBannedUsers, req, res);
        assert.equal(error, undefined);
      }

      {
        const req = {
          query: {
            page: '2',
            limit: '7',
            status: 'approved',
            type: 'video',
            sortOrder: 'asc',
          },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getAllPosts, req, res);
        assert.equal(error, undefined);
      }

      {
        const req = {
          query: {
            page: '2',
            limit: '9',
            search: 'abc',
            status: 'hidden',
            sortOrder: 'desc',
          },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getAllComments, req, res);
        assert.equal(error, undefined);
      }

      assert.equal(calls.users.status, 'banned');
      assert.equal(calls.posts.sortOrder, 1);
      assert.equal(calls.comments.sortOrder, -1);
    } finally {
      AdminService.getAllUsers = originalGetAllUsers;
      AdminService.getAllPosts = originalGetAllPosts;
      AdminService.getAllComments = originalGetAllComments;
    }
  });

  it('post moderation endpoints should validate ids and delegate', async () => {
    const originalGetPostReports = AdminService.getPostReports;
    const originalModeratePost = AdminService.moderatePost;
    const originalDeletePost = AdminService.deletePost;
    const calls = {};

    AdminService.getPostReports = async (...args) => {
      calls.getPostReports = args;
      return { reports: [] };
    };
    AdminService.moderatePost = async (...args) => {
      calls.moderatePost = args;
      return { id: args[0] };
    };
    AdminService.deletePost = async (...args) => {
      calls.deletePost = args;
    };

    try {
      {
        const req = { params: { postId: 'bad-id' }, query: {} };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getPostReports, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = {
          params: { postId: VALID_ID },
          query: { page: '2', limit: '5' },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getPostReports, req, res);
        assert.equal(error, undefined);
      }

      {
        const req = { params: { postId: 'bad-id' }, user: { id: ADMIN_ID } };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.approvePost, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = { params: { postId: VALID_ID }, user: { id: ADMIN_ID } };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.approvePost, req, res);
        assert.equal(error, undefined);
      }

      {
        const req = {
          params: { postId: VALID_ID },
          body: { reason: 'bad content' },
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.deletePost, req, res);
        assert.equal(error, undefined);
      }

      assert.equal(calls.getPostReports[0], VALID_ID);
      assert.deepEqual(calls.moderatePost, [VALID_ID, ADMIN_ID, 'approve']);
      assert.deepEqual(calls.deletePost, [VALID_ID, ADMIN_ID, 'bad content']);
    } finally {
      AdminService.getPostReports = originalGetPostReports;
      AdminService.moderatePost = originalModeratePost;
      AdminService.deletePost = originalDeletePost;
    }
  });

  it('comment moderation endpoints should validate ids and map action message', async () => {
    const originalModerateComment = AdminService.moderateComment;
    let receivedArgs;

    AdminService.moderateComment = async (...args) => {
      receivedArgs = args;
      return { id: args[0] };
    };

    try {
      {
        const req = {
          params: { commentId: 'bad-id' },
          body: { action: 'hide' },
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.moderateComment, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = {
          params: { commentId: VALID_ID },
          body: { action: 'hide', reason: 'spam' },
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.moderateComment, req, res);
        assert.equal(error, undefined);
        assert.equal(res.statusCode, 200);
      }

      {
        const req = {
          params: { commentId: VALID_ID },
          body: { reason: 'remove reason' },
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.deleteComment, req, res);
        assert.equal(error, undefined);
        assert.equal(res.statusCode, 200);
      }

      assert.deepEqual(receivedArgs, [VALID_ID, ADMIN_ID, 'remove', 'remove reason']);
    } finally {
      AdminService.moderateComment = originalModerateComment;
    }
  });

  it('reviewReport should validate id/input and delegate full payload', async () => {
    const originalReviewReport = AdminService.reviewReport;
    let receivedArgs;

    AdminService.reviewReport = async (...args) => {
      receivedArgs = args;
      return { id: args[0], status: 'reviewed' };
    };

    try {
      {
        const req = {
          params: { reportId: 'bad-id' },
          body: { decision: 'resolved' },
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.reviewReport, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = {
          params: { reportId: VALID_ID },
          body: {},
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.reviewReport, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = {
          params: { reportId: VALID_ID },
          body: { decision: 'resolved', actionTaken: 'delete', notes: 'ok' },
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.reviewReport, req, res);
        assert.equal(error, undefined);
      }

      assert.equal(receivedArgs[0], VALID_ID);
      assert.equal(receivedArgs[1], ADMIN_ID);
      assert.equal(receivedArgs[2].decision, 'resolved');
      assert.equal(receivedArgs[2].actionTaken, 'delete');
      assert.equal(receivedArgs[2].notes, 'ok');
    } finally {
      AdminService.reviewReport = originalReviewReport;
    }
  });

  it('deleteUser and getSystemHealth should respond successfully', async () => {
    const originalDeleteUser = UserService.deleteUser;
    let receivedDeleteUserId;

    UserService.deleteUser = async userId => {
      receivedDeleteUserId = userId;
    };

    try {
      {
        const req = {
          params: { userId: VALID_ID },
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.deleteUser, req, res);
        assert.equal(error, undefined);
        assert.equal(receivedDeleteUserId, VALID_ID);
        assert.equal(res.statusCode, 200);
      }

      {
        const req = {};
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getSystemHealth, req, res);
        assert.equal(error, undefined);
        assert.equal(res.statusCode, 200);
        assert.equal(res.jsonPayload.data.status, 'healthy');
      }
    } finally {
      UserService.deleteUser = originalDeleteUser;
    }
  });

  it('should cover remaining admin validation and mapping branches', async () => {
    const originalUnbanUser = AdminService.unbanUser;
    const originalSuspendUser = AdminService.suspendUser;
    const originalWarnUser = AdminService.warnUser;
    const originalModeratePost = AdminService.moderatePost;
    const originalDeletePost = AdminService.deletePost;
    const originalModerateComment = AdminService.moderateComment;
    const originalGetReports = AdminService.getReports;
    const originalBroadcastNotification = AdminService.broadcastNotification;
    let moderatePostArgs;
    let reportFilter;

    AdminService.unbanUser = async () => ({});
    AdminService.suspendUser = async () => ({});
    AdminService.warnUser = async () => ({});
    AdminService.moderatePost = async (...args) => {
      moderatePostArgs = args;
      return { id: args[0] };
    };
    AdminService.deletePost = async () => undefined;
    AdminService.moderateComment = async () => ({});
    AdminService.getReports = async filter => {
      reportFilter = filter;
      return { reports: [], total: 0, page: 1, totalPages: 0, hasMore: false };
    };
    AdminService.broadcastNotification = async () => ({ sentCount: 0 });

    try {
      {
        const req = { body: { userId: 'bad-id' }, user: { id: ADMIN_ID } };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.unbanUser, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = {
          body: { userId: 'bad-id', days: 3 },
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.suspendUser, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = {
          body: { userId: 'bad-id', reason: 'warn' },
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.warnUser, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = {
          params: { postId: 'bad-id' },
          body: { action: 'flag' },
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.moderatePost, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = {
          params: { postId: VALID_ID },
          body: { action: 'flag', reason: 'review' },
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.moderatePost, req, res);
        assert.equal(error, undefined);
        assert.equal(res.statusCode, 200);
      }

      {
        const req = {
          params: { postId: 'bad-id' },
          body: {},
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.deletePost, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = {
          params: { commentId: 'bad-id' },
          body: {},
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.deleteComment, req, res);
        assert.equal(error.statusCode, 400);
      }

      {
        const req = {
          query: { status: 'dismissed', sortOrder: 'asc' },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.getReports, req, res);
        assert.equal(error, undefined);
      }

      {
        const req = {
          body: {},
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(
          AdminController.broadcastNotification,
          req,
          res
        );
        assert.equal(error.statusCode, 400);
      }

      {
        const req = {
          params: { userId: 'bad-id' },
          user: { id: ADMIN_ID },
        };
        const res = createMockResponse();
        const error = await runMiddleware(AdminController.deleteUser, req, res);
        assert.equal(error.statusCode, 400);
      }

      assert.deepEqual(moderatePostArgs, [VALID_ID, ADMIN_ID, 'flag', 'review']);
      assert.equal(reportFilter.status, 'rejected');
      assert.equal(reportFilter.sortOrder, 1);
    } finally {
      AdminService.unbanUser = originalUnbanUser;
      AdminService.suspendUser = originalSuspendUser;
      AdminService.warnUser = originalWarnUser;
      AdminService.moderatePost = originalModeratePost;
      AdminService.deletePost = originalDeletePost;
      AdminService.moderateComment = originalModerateComment;
      AdminService.getReports = originalGetReports;
      AdminService.broadcastNotification = originalBroadcastNotification;
    }
  });
});

