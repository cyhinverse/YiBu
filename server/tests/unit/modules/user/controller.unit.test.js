import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import UserController from '../../../../src/modules/user/user.controller.js';
import UserService from '../../../../src/modules/user/user.service.js';
import cloudinary from '../../../../src/configs/cloudinaryConfig.js';
import {
  createMockResponse,
  runMiddleware,
} from '../../../shared/middlewareTestUtils.js';

const TEST_USER_ID = '507f191e810c19729de860ea';
const ENV_KEYS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const snapshotEnv = () =>
  ENV_KEYS.reduce((acc, key) => {
    acc[key] = process.env[key];
    return acc;
  }, {});

const restoreEnv = envSnapshot => {
  for (const key of ENV_KEYS) {
    if (envSnapshot[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = envSnapshot[key];
    }
  }
};

describe('UserController', () => {
  it('Get_User_By_Id should delegate to service with requester id', async () => {
    const originalGetUserById = UserService.getUserById;
    let receivedArgs;

    UserService.getUserById = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860eb' };
    };

    try {
      const req = {
        params: { id: '507f191e810c19729de860eb' },
        user: { id: TEST_USER_ID },
      };
      const res = createMockResponse();

      const error = await runMiddleware(UserController.Get_User_By_Id, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, ['507f191e810c19729de860eb', TEST_USER_ID]);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.getUserById = originalGetUserById;
    }
  });

  it('getRecommendedUsers should parse limit and delegate', async () => {
    const originalGetRecommendedUsers = UserService.getRecommendedUsers;
    let receivedArgs;

    UserService.getRecommendedUsers = async (...args) => {
      receivedArgs = args;
      return [];
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        query: { limit: '7' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(UserController.getRecommendedUsers, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [TEST_USER_ID, 7]);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.getRecommendedUsers = originalGetRecommendedUsers;
    }
  });
  it('searchUsers should return 400 for short queries', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      query: { q: 'a', page: '1', limit: '20' },
    };
    const res = createMockResponse();

    const error = await runMiddleware(UserController.searchUsers, req, res);

    assert.equal(error, undefined);
    assert.equal(res.statusCode, 400);
    assert.equal(
      res.jsonPayload.message,
      'Search query must be at least 2 characters'
    );
  });

  it('searchUsers should delegate to service with parsed pagination', async () => {
    const originalSearchUsers = UserService.searchUsers;
    let receivedArgs;

    UserService.searchUsers = async (...args) => {
      receivedArgs = args;
      return { users: [], total: 0 };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        query: { query: 'john', page: '2', limit: '5' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(UserController.searchUsers, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedArgs[0], 'john');
      assert.equal(receivedArgs[1], TEST_USER_ID);
      assert.deepEqual(receivedArgs[2], { page: 2, limit: 5 });
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.searchUsers = originalSearchUsers;
    }
  });

  it('followUser should require targetUserId', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      body: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(UserController.followUser, req, res);

    assert.equal(error, undefined);
    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonPayload.message, 'Target user ID is required');
  });

  it('checkFollowStatus should return 404 when target user is not found', async () => {
    const originalResolve = UserService.resolveUserIdOrUsername;
    UserService.resolveUserIdOrUsername = async () => null;

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { targetUserId: 'missing-user' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(UserController.checkFollowStatus, req, res);

      assert.equal(error, undefined);
      assert.equal(res.statusCode, 404);
      assert.equal(res.jsonPayload.message, 'Người dùng không tồn tại');
    } finally {
      UserService.resolveUserIdOrUsername = originalResolve;
    }
  });

  it('getMutualFollowers should return 404 when target cannot be resolved', async () => {
    const originalResolve = UserService.resolveUserIdOrUsername;
    UserService.resolveUserIdOrUsername = async () => null;

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { targetUserId: 'missing' },
        query: { limit: '5' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(UserController.getMutualFollowers, req, res);

      assert.equal(error, undefined);
      assert.equal(res.statusCode, 404);
      assert.equal(res.jsonPayload.message, 'Người dùng không tồn tại');
    } finally {
      UserService.resolveUserIdOrUsername = originalResolve;
    }
  });

  it('getMutualFollowers should delegate to service with parsed limit', async () => {
    const originalResolve = UserService.resolveUserIdOrUsername;
    const originalGetMutualFollowers = UserService.getMutualFollowers;
    let receivedArgs;

    UserService.resolveUserIdOrUsername = async () => '507f191e810c19729de860eb';
    UserService.getMutualFollowers = async (...args) => {
      receivedArgs = args;
      return [];
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { targetUserId: 'target' },
        query: { limit: '8' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(UserController.getMutualFollowers, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [TEST_USER_ID, '507f191e810c19729de860eb', 8]);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.resolveUserIdOrUsername = originalResolve;
      UserService.getMutualFollowers = originalGetMutualFollowers;
    }
  });

  it('checkFollowStatus should include isFollowing flag from status', async () => {
    const originalResolve = UserService.resolveUserIdOrUsername;
    const originalCheckFollowStatus = UserService.checkFollowStatus;

    UserService.resolveUserIdOrUsername = async () => '507f191e810c19729de860eb';
    UserService.checkFollowStatus = async () => 'active';

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { targetUserId: 'target' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(UserController.checkFollowStatus, req, res);

      assert.equal(error, undefined);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.data.status, 'active');
      assert.equal(res.jsonPayload.data.isFollowing, true);
    } finally {
      UserService.resolveUserIdOrUsername = originalResolve;
      UserService.checkFollowStatus = originalCheckFollowStatus;
    }
  });

  it('followUser should map pending status message', async () => {
    const originalResolveUser = UserService.resolveUserIdOrUsername;
    const originalFollowUser = UserService.followUser;
    let followArgs;

    UserService.resolveUserIdOrUsername = async () => '507f191e810c19729de860eb';
    UserService.followUser = async (...args) => {
      followArgs = args;
      return { status: 'pending' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: { targetUserId: 'target_username' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(UserController.followUser, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(followArgs, [TEST_USER_ID, '507f191e810c19729de860eb']);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.message, 'Đã gửi yêu cầu theo dõi');
    } finally {
      UserService.resolveUserIdOrUsername = originalResolveUser;
      UserService.followUser = originalFollowUser;
    }
  });

  it('updatePrivacySettings should normalize legacy aliases', async () => {
    const originalUpdatePrivacySettings = UserService.updatePrivacySettings;
    let receivedArgs;

    UserService.updatePrivacySettings = async (...args) => {
      receivedArgs = args;
      return { ok: true };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: {
          messagePermission: 'nobody',
          isPrivate: true,
          activityStatus: false,
          searchVisibility: true,
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        UserController.updatePrivacySettings,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.equal(receivedArgs[0], TEST_USER_ID);
      assert.equal(receivedArgs[1].allowMessages, 'none');
      assert.equal(receivedArgs[1].profileVisibility, 'private');
      assert.equal(receivedArgs[1].showActivity, false);
      assert.equal(receivedArgs[1].searchable, true);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.updatePrivacySettings = originalUpdatePrivacySettings;
    }
  });

  it('acceptFollowRequest should accept requestId from params alias', async () => {
    const originalAcceptFollowRequest = UserService.acceptFollowRequest;
    let receivedArgs;

    UserService.acceptFollowRequest = async (...args) => {
      receivedArgs = args;
      return { accepted: true };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { requestId: '507f191e810c19729de860eb' },
        body: {},
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        UserController.acceptFollowRequest,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [TEST_USER_ID, '507f191e810c19729de860eb']);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.acceptFollowRequest = originalAcceptFollowRequest;
    }
  });

  it('rejectFollowRequest should validate follower id', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      params: {},
      body: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(UserController.rejectFollowRequest, req, res);

    assert.equal(error, undefined);
    assert.equal(res.statusCode, 400);
    assert.equal(
      res.jsonPayload.message,
      'Request ID or follower ID is required'
    );
  });

  it('getFollowers should delegate with parsed pagination', async () => {
    const originalGetFollowers = UserService.getFollowers;
    let receivedArgs;

    UserService.getFollowers = async (...args) => {
      receivedArgs = args;
      return { users: [], total: 0 };
    };

    try {
      const req = {
        user: { _id: TEST_USER_ID },
        params: { userId: '507f191e810c19729de860eb' },
        query: { page: '2', limit: '4' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(UserController.getFollowers, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        '507f191e810c19729de860eb',
        { page: 2, limit: 4, requesterId: TEST_USER_ID },
      ]);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.getFollowers = originalGetFollowers;
    }
  });

  it('getPendingFollowRequests should delegate with parsed pagination', async () => {
    const originalGetPendingFollowRequests = UserService.getPendingFollowRequests;
    let receivedArgs;

    UserService.getPendingFollowRequests = async (...args) => {
      receivedArgs = args;
      return { users: [], total: 0 };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        query: { page: '2', limit: '9' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        UserController.getPendingFollowRequests,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [TEST_USER_ID, { page: 2, limit: 9 }]);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.getPendingFollowRequests = originalGetPendingFollowRequests;
    }
  });

  it('getFollowing should delegate with parsed pagination', async () => {
    const originalGetFollowing = UserService.getFollowing;
    let receivedArgs;

    UserService.getFollowing = async (...args) => {
      receivedArgs = args;
      return { users: [], total: 0 };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { userId: '507f191e810c19729de860eb' },
        query: { page: '3', limit: '6' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(UserController.getFollowing, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        '507f191e810c19729de860eb',
        { page: 3, limit: 6, requesterId: TEST_USER_ID },
      ]);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.getFollowing = originalGetFollowing;
    }
  });

  it('updateNotificationSettings should map legacy keys', async () => {
    const originalUpdateNotificationSettings =
      UserService.updateNotificationSettings;
    let receivedArgs;

    UserService.updateNotificationSettings = async (...args) => {
      receivedArgs = args;
      return { ok: true };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: {
          newFollower: true,
          directMessages: false,
          likes: true,
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        UserController.updateNotificationSettings,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.equal(receivedArgs[1].follows, true);
      assert.equal(receivedArgs[1].messages, false);
      assert.equal(receivedArgs[1].likes, true);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.updateNotificationSettings = originalUpdateNotificationSettings;
    }
  });

  it('getUserSettings should delegate to service', async () => {
    const originalGetUserSettings = UserService.getUserSettings;
    let receivedUserId;

    UserService.getUserSettings = async userId => {
      receivedUserId = userId;
      return { privacy: {} };
    };

    try {
      const req = { user: { id: TEST_USER_ID } };
      const res = createMockResponse();

      const error = await runMiddleware(UserController.getUserSettings, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedUserId, TEST_USER_ID);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.getUserSettings = originalGetUserSettings;
    }
  });

  it('updateSecuritySettings should delegate with normalized payload', async () => {
    const originalUpdateSecuritySettings = UserService.updateSecuritySettings;
    let receivedArgs;

    UserService.updateSecuritySettings = async (...args) => {
      receivedArgs = args;
      return { ok: true };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: { twoFactorEnabled: true, loginAlerts: false },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        UserController.updateSecuritySettings,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        TEST_USER_ID,
        { twoFactorEnabled: true, loginAlerts: false },
      ]);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.updateSecuritySettings = originalUpdateSecuritySettings;
    }
  });

  it('updateContentSettings should map dataUsage and autoplay aliases', async () => {
    const originalUpdateContentSettings = UserService.updateContentSettings;
    let receivedArgs;

    UserService.updateContentSettings = async (...args) => {
      receivedArgs = args;
      return { ok: true };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: {
          dataUsage: 'low',
          autoplayEnabled: true,
          sensitiveContent: false,
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        UserController.updateContentSettings,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.equal(receivedArgs[1].contentFilter, 'strict');
      assert.equal(receivedArgs[1].autoplayVideos, true);
      assert.equal(receivedArgs[1].showSensitiveContent, false);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.updateContentSettings = originalUpdateContentSettings;
    }
  });

  it('updateThemeSettings should update appearance and optional language', async () => {
    const originalUpdateAppearanceSettings = UserService.updateAppearanceSettings;
    const originalUpdateContentSettings = UserService.updateContentSettings;
    let appearanceArgs;
    let contentArgs;

    UserService.updateAppearanceSettings = async (...args) => {
      appearanceArgs = args;
      return { ok: true };
    };
    UserService.updateContentSettings = async (...args) => {
      contentArgs = args;
      return { ok: true };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: {
          appearance: 'dark',
          reducedMotion: true,
          language: 'vi',
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        UserController.updateThemeSettings,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.equal(appearanceArgs[0], TEST_USER_ID);
      assert.equal(appearanceArgs[1].theme, 'dark');
      assert.equal(appearanceArgs[1].compactMode, true);
      assert.deepEqual(contentArgs, [TEST_USER_ID, { language: 'vi' }]);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.updateAppearanceSettings = originalUpdateAppearanceSettings;
      UserService.updateContentSettings = originalUpdateContentSettings;
    }
  });

  it('blockUser should return 400 when target user id is missing', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      params: {},
      body: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(UserController.blockUser, req, res);

    assert.equal(error, undefined);
    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonPayload.message, 'Thiếu ID người dùng cần chặn');
  });

  it('unblockUser/muteUser/unmuteUser should delegate with id aliases', async () => {
    const originalUnblockUser = UserService.unblockUser;
    const originalMuteUser = UserService.muteUser;
    const originalUnmuteUser = UserService.unmuteUser;
    let unblockArgs;
    let muteArgs;
    let unmuteArgs;

    UserService.unblockUser = async (...args) => {
      unblockArgs = args;
    };
    UserService.muteUser = async (...args) => {
      muteArgs = args;
    };
    UserService.unmuteUser = async (...args) => {
      unmuteArgs = args;
    };

    try {
      const unblockReq = {
        user: { id: TEST_USER_ID },
        params: { blockedUserId: '507f191e810c19729de860eb' },
        body: {},
      };
      const muteReq = {
        user: { id: TEST_USER_ID },
        params: {},
        body: { mutedUserId: '507f191e810c19729de860ec' },
      };
      const unmuteReq = {
        user: { id: TEST_USER_ID },
        params: { targetUserId: '507f191e810c19729de860ed' },
        body: {},
      };

      const unblockRes = createMockResponse();
      const muteRes = createMockResponse();
      const unmuteRes = createMockResponse();

      const unblockError = await runMiddleware(
        UserController.unblockUser,
        unblockReq,
        unblockRes
      );
      const muteError = await runMiddleware(
        UserController.muteUser,
        muteReq,
        muteRes
      );
      const unmuteError = await runMiddleware(
        UserController.unmuteUser,
        unmuteReq,
        unmuteRes
      );

      assert.equal(unblockError, undefined);
      assert.equal(muteError, undefined);
      assert.equal(unmuteError, undefined);
      assert.deepEqual(unblockArgs, [TEST_USER_ID, '507f191e810c19729de860eb']);
      assert.deepEqual(muteArgs, [TEST_USER_ID, '507f191e810c19729de860ec']);
      assert.deepEqual(unmuteArgs, [TEST_USER_ID, '507f191e810c19729de860ed']);
      assert.equal(unblockRes.statusCode, 200);
      assert.equal(muteRes.statusCode, 200);
      assert.equal(unmuteRes.statusCode, 200);
    } finally {
      UserService.unblockUser = originalUnblockUser;
      UserService.muteUser = originalMuteUser;
      UserService.unmuteUser = originalUnmuteUser;
    }
  });

  it('getBlockList and getMuteList should return service results', async () => {
    const originalGetBlockedUsers = UserService.getBlockedUsers;
    const originalGetMutedUsers = UserService.getMutedUsers;

    UserService.getBlockedUsers = async () => [{ _id: '507f191e810c19729de860eb' }];
    UserService.getMutedUsers = async () => [{ _id: '507f191e810c19729de860ec' }];

    try {
      const req = {
        user: { id: TEST_USER_ID },
      };
      const blockRes = createMockResponse();
      const muteRes = createMockResponse();

      const blockError = await runMiddleware(UserController.getBlockList, req, blockRes);
      const muteError = await runMiddleware(UserController.getMuteList, req, muteRes);

      assert.equal(blockError, undefined);
      assert.equal(muteError, undefined);
      assert.equal(blockRes.statusCode, 200);
      assert.equal(muteRes.statusCode, 200);
      assert.equal(blockRes.jsonPayload.data.length, 1);
      assert.equal(muteRes.jsonPayload.data.length, 1);
    } finally {
      UserService.getBlockedUsers = originalGetBlockedUsers;
      UserService.getMutedUsers = originalGetMutedUsers;
    }
  });

  it('unfollowUser should require targetUserId and delegate on valid payload', async () => {
    {
      const req = {
        user: { id: TEST_USER_ID },
        body: {},
      };
      const res = createMockResponse();

      const error = await runMiddleware(UserController.unfollowUser, req, res);

      assert.equal(error, undefined);
      assert.equal(res.statusCode, 400);
      assert.equal(res.jsonPayload.message, 'Target user ID is required');
    }

    const originalResolveUser = UserService.resolveUserIdOrUsername;
    const originalUnfollowUser = UserService.unfollowUser;
    let unfollowArgs;

    UserService.resolveUserIdOrUsername = async () => '507f191e810c19729de860eb';
    UserService.unfollowUser = async (...args) => {
      unfollowArgs = args;
      return { unfollowed: true };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: { targetUserId: 'target_username' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(UserController.unfollowUser, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(unfollowArgs, [TEST_USER_ID, '507f191e810c19729de860eb']);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.resolveUserIdOrUsername = originalResolveUser;
      UserService.unfollowUser = originalUnfollowUser;
    }
  });

  it('acceptFollowRequest should return 400 when follower id is missing', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      params: {},
      body: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(UserController.acceptFollowRequest, req, res);

    assert.equal(error, undefined);
    assert.equal(res.statusCode, 400);
    assert.equal(
      res.jsonPayload.message,
      'Request ID or follower ID is required'
    );
  });

  it('rejectFollowRequest should delegate when follower id exists', async () => {
    const originalRejectFollowRequest = UserService.rejectFollowRequest;
    let receivedArgs;

    UserService.rejectFollowRequest = async (...args) => {
      receivedArgs = args;
      return { rejected: true };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: {},
        body: { followerId: '507f191e810c19729de860eb' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(UserController.rejectFollowRequest, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [TEST_USER_ID, '507f191e810c19729de860eb']);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.rejectFollowRequest = originalRejectFollowRequest;
    }
  });

  it('GET_PROFILE_BY_ID should delegate to profile service', async () => {
    const originalGetUserProfileByIdOrUsername =
      UserService.getUserProfileByIdOrUsername;
    let receivedArgs;

    UserService.getUserProfileByIdOrUsername = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860eb', username: 'target' };
    };

    try {
      const req = {
        params: { id: 'target' },
        user: { id: TEST_USER_ID },
      };
      const res = createMockResponse();

      const error = await runMiddleware(UserController.GET_PROFILE_BY_ID, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, ['target', TEST_USER_ID]);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.data.username, 'target');
    } finally {
      UserService.getUserProfileByIdOrUsername =
        originalGetUserProfileByIdOrUsername;
    }
  });

  it('updateProfileSettings should update profile without files', async () => {
    const originalUpdateProfile = UserService.updateProfile;
    let receivedArgs;

    UserService.updateProfile = async (...args) => {
      receivedArgs = args;
      return { _id: args[0], ...args[1] };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: { name: 'new name' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        UserController.updateProfileSettings,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [TEST_USER_ID, { name: 'new name' }]);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.updateProfile = originalUpdateProfile;
    }
  });

  it('updateProfileSettings should upload avatar and cover when files are provided', async () => {
    const originalEnv = snapshotEnv();
    const originalUploadStream = cloudinary.uploader.upload_stream;
    const originalUpdateProfile = UserService.updateProfile;
    const uploadFolders = [];
    let receivedArgs;

    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';

    cloudinary.uploader.upload_stream = (options, cb) => {
      uploadFolders.push(options.folder);
      return {
        end: () => cb(null, { secure_url: `https://cdn.example/${options.folder}` }),
      };
    };

    UserService.updateProfile = async (...args) => {
      receivedArgs = args;
      return { _id: args[0], ...args[1] };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: { bio: 'updated' },
        files: {
          avatar: [{ buffer: Buffer.from('avatar-file') }],
          cover: [{ buffer: Buffer.from('cover-file') }],
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        UserController.updateProfileSettings,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.equal(res.statusCode, 200);
      assert.deepEqual(uploadFolders, ['avatars', 'covers']);
      assert.equal(receivedArgs[1].avatar, 'https://cdn.example/avatars');
      assert.equal(receivedArgs[1].cover, 'https://cdn.example/covers');
    } finally {
      cloudinary.uploader.upload_stream = originalUploadStream;
      UserService.updateProfile = originalUpdateProfile;
      restoreEnv(originalEnv);
    }
  });

  it('updatePrivacySettings should map following and isPrivate=false aliases', async () => {
    const originalUpdatePrivacySettings = UserService.updatePrivacySettings;
    let receivedArgs;

    UserService.updatePrivacySettings = async (...args) => {
      receivedArgs = args;
      return { ok: true };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: {
          messagePermission: 'following',
          isPrivate: false,
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        UserController.updatePrivacySettings,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.equal(receivedArgs[1].allowMessages, 'followers');
      assert.equal(receivedArgs[1].profileVisibility, 'public');
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.updatePrivacySettings = originalUpdatePrivacySettings;
    }
  });

  it('block/unblock/mute/unmute should cover remaining validation branches', async () => {
    const originalBlockUser = UserService.blockUser;
    let blockArgs;

    UserService.blockUser = async (...args) => {
      blockArgs = args;
    };

    try {
      {
        const req = {
          user: { id: TEST_USER_ID },
          params: {},
          body: { targetUserId: '507f191e810c19729de860eb' },
        };
        const res = createMockResponse();
        const error = await runMiddleware(UserController.blockUser, req, res);
        assert.equal(error, undefined);
        assert.equal(res.statusCode, 200);
      }

      {
        const req = { user: { id: TEST_USER_ID }, params: {}, body: {} };
        const res = createMockResponse();
        const error = await runMiddleware(UserController.unblockUser, req, res);
        assert.equal(error, undefined);
        assert.equal(res.statusCode, 400);
      }

      {
        const req = { user: { id: TEST_USER_ID }, params: {}, body: {} };
        const res = createMockResponse();
        const error = await runMiddleware(UserController.muteUser, req, res);
        assert.equal(error, undefined);
        assert.equal(res.statusCode, 400);
      }

      {
        const req = { user: { id: TEST_USER_ID }, params: {}, body: {} };
        const res = createMockResponse();
        const error = await runMiddleware(UserController.unmuteUser, req, res);
        assert.equal(error, undefined);
        assert.equal(res.statusCode, 400);
      }

      assert.deepEqual(blockArgs, [TEST_USER_ID, '507f191e810c19729de860eb']);
    } finally {
      UserService.blockUser = originalBlockUser;
    }
  });
});

