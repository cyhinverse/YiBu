import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import UserService from '../../../../src/modules/user/user.service.js';
import userRepository from '../../../../src/modules/user/user.repository.js';

const USER_ID = '507f191e810c19729de860ea';
const OTHER_ID = '507f191e810c19729de860eb';
const THIRD_ID = '507f191e810c19729de860ec';

const originalRepositoryMethods = { ...userRepository };
const originalStartSession = mongoose.startSession;
const originalGetUserById = UserService.getUserById;
const originalGetUserProfile = UserService.getUserProfile;
const originalUpdateFollowCountsOnDelete = UserService._updateFollowCountsOnDelete;

function makeChain(value) {
  return {
    select() {
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
    populate() {
      return this;
    },
    lean: async () => value,
  };
}

afterEach(() => {
  Object.assign(userRepository, originalRepositoryMethods);
  mongoose.startSession = originalStartSession;
  UserService.getUserById = originalGetUserById;
  UserService.getUserProfile = originalGetUserProfile;
  UserService._updateFollowCountsOnDelete = originalUpdateFollowCountsOnDelete;
});

describe('UserService', () => {
  it('isValidObjectId should validate strict 24-char hex ObjectId', () => {
    assert.equal(UserService.isValidObjectId(USER_ID), true);
    assert.equal(UserService.isValidObjectId('invalid-id'), false);
    assert.equal(UserService.isValidObjectId('507f191e810c19729de860eA!'), false);
  });

  it('resolveUserIdOrUsername should resolve by ObjectId', async () => {
    const originalFindById = userRepository.userFindById;
    userRepository.userFindById = id => ({
      select: () => ({
        lean: async () => ({ _id: id }),
      }),
    });

    try {
      const result = await UserService.resolveUserIdOrUsername(USER_ID);
      assert.equal(result, USER_ID);
    } finally {
      userRepository.userFindById = originalFindById;
    }
  });

  it('resolveUserIdOrUsername should resolve by username', async () => {
    const originalFindOne = userRepository.userFindOne;
    userRepository.userFindOne = query => ({
      select: () => ({
        lean: async () => ({
          _id: OTHER_ID,
          username: query.username,
        }),
      }),
    });

    try {
      const result = await UserService.resolveUserIdOrUsername('CyHin_User');
      assert.equal(result, OTHER_ID);
    } finally {
      userRepository.userFindOne = originalFindOne;
    }
  });

  it('resolveUserIdOrUsername should return null for missing identifier', async () => {
    const result = await UserService.resolveUserIdOrUsername('');
    assert.equal(result, null);
  });

  it('getUserById should throw bad request when userId is missing', async () => {
    await assert.rejects(
      UserService.getUserById(null),
      err => err?.statusCode === 400
    );
  });

  it('getUserById should return private limited profile when requester is not following', async () => {
    const originalFindById = userRepository.userFindById;
    const originalFollowStatus = userRepository.followGetFollowStatus;

    userRepository.userFindById = () => ({
      select: () => ({
        lean: async () => ({
          _id: USER_ID,
          username: 'private-user',
          name: 'Private User',
          avatar: 'https://example.com/a.png',
          verified: false,
          followersCount: 10,
          followingCount: 2,
          privacy: { profileVisibility: 'private' },
        }),
      }),
    });
    userRepository.followGetFollowStatus = async () => 'none';

    try {
      const result = await UserService.getUserById(USER_ID, OTHER_ID);

      assert.equal(result.isPrivate, true);
      assert.equal(result.username, 'private-user');
      assert.equal(result.followStatus, undefined);
    } finally {
      userRepository.userFindById = originalFindById;
      userRepository.followGetFollowStatus = originalFollowStatus;
    }
  });

  it('updateProfile should normalize username/gender/interests', async () => {
    const originalUpdate = userRepository.userFindByIdAndUpdate;
    let receivedUpdate;

    userRepository.userFindByIdAndUpdate = (_id, update) => {
      receivedUpdate = update;
      return {
        select: async () => ({ _id: USER_ID }),
      };
    };

    try {
      await UserService.updateProfile(USER_ID, {
        username: '  New_User  ',
        gender: 'prefer_not_to_say',
        interests: 'Tech, AI,Node',
      });

      assert.equal(receivedUpdate.$set.username, 'new_user');
      assert.equal(receivedUpdate.$set.gender, 'other');
      assert.deepEqual(receivedUpdate.$set.interests, ['tech', 'ai', 'node']);
    } finally {
      userRepository.userFindByIdAndUpdate = originalUpdate;
    }
  });

  it('searchUsers should short-circuit for short query', async () => {
    const result = await UserService.searchUsers('a', USER_ID);
    assert.deepEqual(result, { users: [], total: 0 });
  });

  it('searchUsers should exclude blocked/muted users and annotate follow status', async () => {
    let searchQuery;
    userRepository.userSettingsFindOne = () =>
      makeChain({ blockedUsers: [OTHER_ID], mutedUsers: [THIRD_ID] });
    userRepository.userFind = query => {
      searchQuery = query;
      return makeChain([
        { _id: OTHER_ID, username: 'other' },
        { _id: '507f191e810c19729de860ed', username: 'another' },
      ]);
    };
    userRepository.userCountDocuments = async () => 2;
    userRepository.followFind = () => makeChain([{ following: OTHER_ID }]);

    const result = await UserService.searchUsers('john', USER_ID, { page: 1, limit: 10 });

    assert.equal(searchQuery._id.$nin.includes(USER_ID), true);
    assert.equal(searchQuery._id.$nin.includes(OTHER_ID), true);
    assert.equal(searchQuery._id.$nin.includes(THIRD_ID), true);
    assert.equal(result.users[0].isFollowing, true);
    assert.equal(result.users[1].isFollowing, false);
    assert.equal(result.total, 2);
  });

  it('searchUsers should work when settings are missing and no follow relation exists', async () => {
    let searchQuery;
    userRepository.userSettingsFindOne = () => makeChain(null);
    userRepository.userFind = query => {
      searchQuery = query;
      return makeChain([{ _id: OTHER_ID, username: 'other' }]);
    };
    userRepository.userCountDocuments = async () => 1;
    userRepository.followFind = () => makeChain([]);

    const result = await UserService.searchUsers('other', USER_ID, {
      page: 1,
      limit: 5,
    });

    assert.deepEqual(searchQuery._id.$nin, [USER_ID]);
    assert.equal(result.users.length, 1);
    assert.equal(result.users[0].isFollowing, false);
  });

  it('getRecommendedUsers should delegate to repository', async () => {
    userRepository.userGetRecommendedUsers = async () => [{ _id: OTHER_ID }];
    const result = await UserService.getRecommendedUsers(USER_ID, 5);
    assert.deepEqual(result, [{ _id: OTHER_ID }]);
  });

  it('followUser should create follow notification for active follow result', async () => {
    let notificationPayload;
    userRepository.followFollow = async () => ({ success: true, status: 'active' });
    userRepository.userFindById = () =>
      makeChain({ _id: USER_ID, username: 'alice' });
    userRepository.notificationCreateNotification = async payload => {
      notificationPayload = payload;
    };

    const result = await UserService.followUser(USER_ID, OTHER_ID);
    assert.equal(result.success, true);
    assert.equal(notificationPayload.recipient, OTHER_ID);
    assert.match(notificationPayload.content, /alice/);
  });

  it('followUser should skip notification for pending follow requests', async () => {
    let notified = false;
    userRepository.followFollow = async () => ({ success: true, status: 'pending' });
    userRepository.notificationCreateNotification = async () => {
      notified = true;
    };

    const result = await UserService.followUser(USER_ID, OTHER_ID);
    assert.equal(result.status, 'pending');
    assert.equal(notified, false);
  });

  it('followUser should skip notification when follow action fails', async () => {
    let notified = false;
    userRepository.followFollow = async () => ({ success: false, status: 'none' });
    userRepository.notificationCreateNotification = async () => {
      notified = true;
    };

    const result = await UserService.followUser(USER_ID, OTHER_ID);
    assert.equal(result.success, false);
    assert.equal(notified, false);
  });

  it('unfollowUser/checkFollowStatus/getMutualFollowers should delegate to repository', async () => {
    userRepository.followUnfollow = async () => ({ success: true });
    userRepository.followGetFollowStatus = async () => 'active';
    userRepository.followGetMutualFollowers = async () => [{ _id: THIRD_ID }];

    const unfollowResult = await UserService.unfollowUser(USER_ID, OTHER_ID);
    const statusResult = await UserService.checkFollowStatus(USER_ID, OTHER_ID);
    const mutualResult = await UserService.getMutualFollowers(USER_ID, OTHER_ID, 3);

    assert.equal(unfollowResult.success, true);
    assert.equal(statusResult, 'active');
    assert.deepEqual(mutualResult, [{ _id: THIRD_ID }]);
  });

  it('getFollowers/getFollowing should annotate isFollowing for requester', async () => {
    userRepository.followGetFollowers = async () => [
      { _id: OTHER_ID, username: 'other' },
      { _id: THIRD_ID, username: 'third' },
    ];
    userRepository.followGetFollowing = async () => [
      { _id: OTHER_ID, username: 'other' },
      { _id: THIRD_ID, username: 'third' },
    ];
    userRepository.followFind = () => makeChain([{ following: OTHER_ID }]);

    const followers = await UserService.getFollowers(USER_ID, { requesterId: USER_ID });
    const following = await UserService.getFollowing(USER_ID, { requesterId: USER_ID });

    assert.equal(followers[0].isFollowing, true);
    assert.equal(followers[1].isFollowing, false);
    assert.equal(following[0].isFollowing, true);
    assert.equal(following[1].isFollowing, false);
  });

  it('acceptFollowRequest should notify requester on success', async () => {
    let notificationPayload;
    userRepository.followAcceptFollowRequest = async () => ({
      success: true,
      follow: { follower: OTHER_ID },
    });
    userRepository.notificationCreateNotification = async payload => {
      notificationPayload = payload;
    };

    const result = await UserService.acceptFollowRequest(USER_ID, OTHER_ID);
    assert.equal(result.success, true);
    assert.equal(notificationPayload.recipient, OTHER_ID);
  });

  it('acceptFollowRequest should not notify when request is not accepted', async () => {
    let notified = false;
    userRepository.followAcceptFollowRequest = async () => ({
      success: false,
      follow: null,
    });
    userRepository.notificationCreateNotification = async () => {
      notified = true;
    };

    const result = await UserService.acceptFollowRequest(USER_ID, OTHER_ID);
    assert.equal(result.success, false);
    assert.equal(notified, false);
  });

  it('rejectFollowRequest/getPendingFollowRequests should delegate to repository', async () => {
    userRepository.followRejectFollowRequest = async () => ({ success: true });
    userRepository.followGetPendingRequests = async () => [{ _id: OTHER_ID }];

    const rejectResult = await UserService.rejectFollowRequest(USER_ID, OTHER_ID);
    const pendingResult = await UserService.getPendingFollowRequests(USER_ID, {
      page: 1,
      limit: 10,
    });

    assert.equal(rejectResult.success, true);
    assert.deepEqual(pendingResult, [{ _id: OTHER_ID }]);
  });

  it('getUserSettings should throw not found when user does not exist', async () => {
    userRepository.userFindById = () => makeChain(null);
    await assert.rejects(
      UserService.getUserSettings(USER_ID),
      err => err?.statusCode === 404
    );
  });

  it('getUserSettings should merge user privacy and notification defaults', async () => {
    userRepository.userFindById = () =>
      makeChain({
        _id: USER_ID,
        privacy: {
          profileVisibility: 'private',
          allowMessages: 'following',
          showActivity: false,
        },
      });
    userRepository.userSettingsGetOrCreate = async () => ({
      toObject: () => ({
        privacy: { showOnlineStatus: true },
        notifications: {
          push: { likes: false, comments: true, enabled: true },
          email: { enabled: false },
        },
      }),
    });

    const settings = await UserService.getUserSettings(USER_ID);
    assert.equal(settings.privacy.profileVisibility, 'private');
    assert.equal(settings.privacy.messagePermission, 'following');
    assert.equal(settings.notifications.likes, false);
    assert.equal(settings.notifications.comments, true);
    assert.equal(settings.notifications.email, false);
  });

  it('getUserSettings should keep privacy defaults when notification settings are absent', async () => {
    userRepository.userFindById = () =>
      makeChain({
        _id: USER_ID,
        privacy: {},
      });
    userRepository.userSettingsGetOrCreate = async () => ({
      toObject: () => ({
        privacy: {},
      }),
    });

    const settings = await UserService.getUserSettings(USER_ID);

    assert.equal(settings.privacy.profileVisibility, 'public');
    assert.equal(settings.privacy.allowMessages, 'everyone');
    assert.equal(settings.notifications, undefined);
  });

  it('updatePrivacySettings should update and return merged privacy output', async () => {
    userRepository.userFindByIdAndUpdate = async () => ({
      _id: USER_ID,
      privacy: {
        profileVisibility: 'private',
        allowMessages: 'following',
        showActivity: false,
      },
    });
    userRepository.userSettingsFindOneAndUpdate = async () => ({});
    userRepository.userSettingsFindOne = async () => ({
      privacy: {
        postVisibility: 'followers',
        searchable: false,
        showOnlineStatus: false,
      },
    });

    const result = await UserService.updatePrivacySettings(USER_ID, {
      profileVisibility: 'private',
      allowMessages: 'following',
      showActivity: false,
      postVisibility: 'followers',
      searchable: false,
      showOnlineStatus: false,
    });

    assert.equal(result.profileVisibility, 'private');
    assert.equal(result.messagePermission, 'following');
    assert.equal(result.postVisibility, 'followers');
    assert.equal(result.searchable, false);
  });

  it('updateNotificationSettings should map legacy fields to nested push/email keys', async () => {
    let updateDoc;
    userRepository.userSettingsFindOneAndUpdate = async (_query, update) => {
      updateDoc = update;
      return {
        notifications: {
          push: { likes: false, comments: false, enabled: false },
          email: { enabled: true },
        },
      };
    };

    const result = await UserService.updateNotificationSettings(USER_ID, {
      likes: false,
      replies: false,
      push: false,
      email: true,
    });

    assert.equal(updateDoc.$set['notifications.push.likes'], false);
    assert.equal(updateDoc.$set['notifications.push.comments'], false);
    assert.equal(updateDoc.$set['notifications.push.enabled'], false);
    assert.equal(updateDoc.$set['notifications.email.enabled'], true);
    assert.equal(result.likes, false);
    assert.equal(result.push, false);
    assert.equal(result.email, true);
  });

  it('updateSecuritySettings should persist and return security settings', async () => {
    userRepository.userSettingsFindOneAndUpdate = async () => ({
      security: { twoFactorEnabled: true, loginAlerts: false },
    });

    const result = await UserService.updateSecuritySettings(USER_ID, {
      twoFactorEnabled: true,
      loginAlerts: false,
    });

    assert.deepEqual(result, { twoFactorEnabled: true, loginAlerts: false });
  });

  it('updateAppearanceSettings should return existing config when no fields provided', async () => {
    userRepository.userSettingsGetOrCreate = async () => ({
      appearance: { theme: 'dark' },
    });

    const result = await UserService.updateAppearanceSettings(USER_ID, {});
    assert.deepEqual(result, { theme: 'dark' });
  });

  it('updateContentSettings should return existing config when no fields provided', async () => {
    userRepository.userSettingsGetOrCreate = async () => ({
      content: { language: 'vi' },
    });

    const result = await UserService.updateContentSettings(USER_ID, {});
    assert.deepEqual(result, { language: 'vi' });
  });

  it('blockUser should validate self-block and target existence', async () => {
    await assert.rejects(
      UserService.blockUser(USER_ID, USER_ID),
      err => err?.statusCode === 400
    );

    userRepository.userFindById = async () => null;
    await assert.rejects(
      UserService.blockUser(USER_ID, OTHER_ID),
      err => err?.statusCode === 404
    );
  });

  it('blockUser should add block relation, unfollow both sides and record interaction', async () => {
    let unfollowCalls = 0;
    let interactionPayload;
    userRepository.userFindById = async () => ({ _id: OTHER_ID });
    userRepository.userSettingsFindOneAndUpdate = async () => ({});
    userRepository.followUnfollow = async () => {
      unfollowCalls += 1;
    };
    userRepository.userInteractionRecord = async payload => {
      interactionPayload = payload;
    };

    const result = await UserService.blockUser(USER_ID, OTHER_ID);
    assert.equal(result.success, true);
    assert.equal(unfollowCalls, 2);
    assert.equal(interactionPayload.interactionType, 'block');
  });

  it('unblock/mute/unmute should update lists and record mute interaction', async () => {
    let interactionPayload;
    userRepository.userSettingsFindOneAndUpdate = async () => ({});
    userRepository.userInteractionRecord = async payload => {
      interactionPayload = payload;
    };

    const unblockResult = await UserService.unblockUser(USER_ID, OTHER_ID);
    const muteResult = await UserService.muteUser(USER_ID, OTHER_ID);
    const unmuteResult = await UserService.unmuteUser(USER_ID, OTHER_ID);

    assert.equal(unblockResult.success, true);
    assert.equal(muteResult.success, true);
    assert.equal(unmuteResult.success, true);
    assert.equal(interactionPayload.interactionType, 'mute');
  });

  it('getBlockedUsers/getMutedUsers should return populated user lists', async () => {
    let callIndex = 0;
    userRepository.userSettingsFindOne = () => ({
      populate() {
        callIndex += 1;
        return this;
      },
      lean: async () =>
        callIndex === 1
          ? { blockedUsers: [{ _id: OTHER_ID }] }
          : { mutedUsers: [{ _id: THIRD_ID }] },
    });

    const blockedUsers = await UserService.getBlockedUsers(USER_ID);
    const mutedUsers = await UserService.getMutedUsers(USER_ID);

    assert.deepEqual(blockedUsers, [{ _id: OTHER_ID }]);
    assert.deepEqual(mutedUsers, [{ _id: THIRD_ID }]);
  });

  it('getUserById should throw not found when target user does not exist', async () => {
    userRepository.userFindById = () => ({
      select: () => ({
        lean: async () => null,
      }),
    });

    await assert.rejects(
      UserService.getUserById(USER_ID),
      err => err?.statusCode === 404
    );
  });

  it('getUserById should return full profile when requester follows private user', async () => {
    userRepository.userFindById = () => ({
      select: () => ({
        lean: async () => ({
          _id: USER_ID,
          username: 'private-user',
          privacy: { profileVisibility: 'private' },
        }),
      }),
    });
    userRepository.followGetFollowStatus = async () => 'active';

    const result = await UserService.getUserById(USER_ID, OTHER_ID);
    assert.equal(result.followStatus, 'active');
    assert.equal(result.isFollowing, true);
    assert.equal(result.username, 'private-user');
  });

  it('getUserProfile should return private payload or include recent posts for visible profile', async () => {
    UserService.getUserById = async () => ({
      _id: USER_ID,
      username: 'u',
      isPrivate: true,
    });
    const privateResult = await UserService.getUserProfile(USER_ID, OTHER_ID);
    assert.equal(privateResult.isPrivate, true);

    let receivedQuery;
    UserService.getUserById = async () => ({
      _id: USER_ID,
      username: 'u',
      isPrivate: false,
    });
    userRepository.postFind = query => {
      receivedQuery = query;
      return makeChain([{ _id: 'post-1' }]);
    };
    const ownResult = await UserService.getUserProfile(USER_ID, USER_ID);
    assert.deepEqual(receivedQuery.visibility.$in, ['public', 'followers', 'private']);
    assert.equal(ownResult.posts.length, 1);

    const otherResult = await UserService.getUserProfile(USER_ID, OTHER_ID);
    assert.equal(otherResult.posts.length, 1);
  });

  it('getUserProfileByIdOrUsername should resolve id and username, and reject unknown username', async () => {
    let receivedUserId;
    UserService.getUserProfile = async userId => {
      receivedUserId = userId;
      return { _id: userId };
    };

    await UserService.getUserProfileByIdOrUsername(USER_ID, OTHER_ID);
    assert.equal(receivedUserId, USER_ID);

    userRepository.userFindOne = () => ({
      select: () => ({
        lean: async () => null,
      }),
    });
    await assert.rejects(
      UserService.getUserProfileByIdOrUsername('unknown_name', OTHER_ID),
      err => err?.statusCode === 404
    );

    userRepository.userFindOne = () => ({
      select: () => ({
        lean: async () => ({ _id: OTHER_ID }),
      }),
    });
    const result = await UserService.getUserProfileByIdOrUsername('KnownName', USER_ID);
    assert.equal(result._id, OTHER_ID);
  });

  it('updateProfile should parse birthday and map repository errors', async () => {
    let updatePayload;
    userRepository.userFindByIdAndUpdate = (_id, update) => {
      updatePayload = update;
      return {
        select: async () => ({ _id: USER_ID }),
      };
    };

    await UserService.updateProfile(USER_ID, {
      birthday: '2020-01-02',
      bio: 'hello',
    });
    assert.ok(updatePayload.$set.birthday instanceof Date);
    assert.equal(updatePayload.$set.bio, 'hello');

    userRepository.userFindByIdAndUpdate = () => ({
      select: async () => {
        const err = new Error('duplicate');
        err.code = 11000;
        err.keyPattern = { username: 1 };
        throw err;
      },
    });
    await assert.rejects(
      UserService.updateProfile(USER_ID, { username: 'dup' }),
      err => err?.statusCode === 400 && err?.errorCode === 'USERNAME_TAKEN'
    );

    const dbError = new Error('db down');
    userRepository.userFindByIdAndUpdate = () => ({
      select: async () => {
        throw dbError;
      },
    });
    await assert.rejects(UserService.updateProfile(USER_ID, { name: 'x' }), /db down/);

    userRepository.userFindByIdAndUpdate = () => ({
      select: async () => null,
    });
    await assert.rejects(
      UserService.updateProfile(USER_ID, { name: 'x' }),
      err => err?.statusCode === 404
    );
  });

  it('deleteUser should abort when user is not found', async () => {
    let aborted = false;
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {
        aborted = true;
      },
      endSession() {},
    };
    mongoose.startSession = async () => session;
    userRepository.userFindById = () => ({
      session: async () => null,
    });

    await assert.rejects(
      UserService.deleteUser(USER_ID),
      err => err?.statusCode === 404
    );
    assert.equal(aborted, true);
  });

  it('deleteUser should soft-delete user-related data and commit transaction', async () => {
    let committed = false;
    const session = {
      startTransaction() {},
      commitTransaction: async () => {
        committed = true;
      },
      abortTransaction: async () => {},
      endSession() {},
    };
    const sessionResult = () => ({
      session: async () => ({}),
    });
    mongoose.startSession = async () => session;
    userRepository.userFindById = () => ({
      session: async () => ({ _id: USER_ID }),
    });
    userRepository.postFind = () => ({
      select() {
        return this;
      },
      session: async () => [{ _id: 'post-1' }],
    });
    userRepository.postUpdateMany = sessionResult;
    userRepository.commentUpdateMany = sessionResult;
    userRepository.likeDeleteMany = sessionResult;
    userRepository.savePostDeleteMany = sessionResult;
    userRepository.followDeleteMany = sessionResult;
    userRepository.userInteractionDeleteMany = sessionResult;
    userRepository.messageDeleteMany = sessionResult;
    userRepository.notificationDeleteMany = sessionResult;
    userRepository.userSettingsDeleteOne = sessionResult;
    UserService._updateFollowCountsOnDelete = async () => {};
    userRepository.userFindByIdAndDelete = sessionResult;

    const result = await UserService.deleteUser(USER_ID);
    assert.equal(result._id, USER_ID);
    assert.equal(committed, true);
  });

  it('_updateFollowCountsOnDelete should decrement follower/following counters when relations exist', async () => {
    let followFindCalls = 0;
    const updateManyCalls = [];
    userRepository.followFind = query => ({
      select() {
        return this;
      },
      session: async () => {
        followFindCalls += 1;
        if (query.following) {
          return [{ follower: OTHER_ID }];
        }
        return [{ following: THIRD_ID }];
      },
    });
    userRepository.userUpdateMany = (query, update) => {
      updateManyCalls.push({ query, update });
      return {
        session: async () => ({}),
      };
    };

    await UserService._updateFollowCountsOnDelete(USER_ID, {});

    assert.equal(followFindCalls, 2);
    assert.equal(updateManyCalls.length, 2);
    assert.deepEqual(updateManyCalls[0].update, { $inc: { followingCount: -1 } });
    assert.deepEqual(updateManyCalls[1].update, { $inc: { followersCount: -1 } });
  });

  it('_updateFollowCountsOnDelete should skip updates when no relations exist', async () => {
    let updateCalled = false;
    userRepository.followFind = () => ({
      select() {
        return this;
      },
      session: async () => [],
    });
    userRepository.userUpdateMany = () => {
      updateCalled = true;
      return {
        session: async () => ({}),
      };
    };

    await UserService._updateFollowCountsOnDelete(USER_ID, {});
    assert.equal(updateCalled, false);
  });

  it('getFollowers/getFollowing should return raw lists when requester is not provided', async () => {
    userRepository.followGetFollowers = async () => [{ _id: OTHER_ID }];
    userRepository.followGetFollowing = async () => [{ _id: THIRD_ID }];

    const followers = await UserService.getFollowers(USER_ID);
    const following = await UserService.getFollowing(USER_ID);

    assert.deepEqual(followers, [{ _id: OTHER_ID }]);
    assert.deepEqual(following, [{ _id: THIRD_ID }]);
  });

  it('updatePrivacySettings should throw when user is not found', async () => {
    userRepository.userFindByIdAndUpdate = async () => null;

    await assert.rejects(
      UserService.updatePrivacySettings(USER_ID, { profileVisibility: 'private' }),
      err => err?.statusCode === 404
    );
  });

  it('updatePrivacySettings should map follower/following visibility fields', async () => {
    let settingsUpdate;
    userRepository.userFindByIdAndUpdate = async () => ({
      _id: USER_ID,
      privacy: {
        profileVisibility: 'public',
        allowMessages: 'everyone',
        showActivity: true,
      },
    });
    userRepository.userSettingsFindOneAndUpdate = async (_query, update) => {
      settingsUpdate = update;
      return {};
    };
    userRepository.userSettingsFindOne = async () => ({ privacy: {} });

    await UserService.updatePrivacySettings(USER_ID, {
      whoCanSeeFollowers: 'followers',
      whoCanSeeFollowing: 'nobody',
      whoCanSeeLikes: 'followers',
    });

    assert.equal(settingsUpdate.$set['privacy.whoCanSeeFollowers'], 'followers');
    assert.equal(settingsUpdate.$set['privacy.whoCanSeeFollowing'], 'nobody');
    assert.equal(settingsUpdate.$set['privacy.whoCanSeeLikes'], 'followers');
  });

  it('updatePrivacySettings should skip userSettings update when no extended privacy fields provided', async () => {
    let settingsUpdated = false;
    userRepository.userFindByIdAndUpdate = async () => ({
      _id: USER_ID,
      privacy: {
        profileVisibility: 'private',
        allowMessages: 'everyone',
        showActivity: true,
      },
    });
    userRepository.userSettingsFindOneAndUpdate = async () => {
      settingsUpdated = true;
      return {};
    };
    userRepository.userSettingsFindOne = async () => null;

    const result = await UserService.updatePrivacySettings(USER_ID, {
      profileVisibility: 'private',
    });

    assert.equal(settingsUpdated, false);
    assert.equal(result.profileVisibility, 'private');
    assert.equal(result.postVisibility, 'public');
  });

  it('updateNotificationSettings should map nested email/push objects and unknown keys', async () => {
    let updateDoc;
    userRepository.userSettingsFindOneAndUpdate = async (_query, update) => {
      updateDoc = update;
      return {
        notifications: {
          push: { enabled: true, comments: false },
          email: { enabled: false, newsletters: true },
        },
      };
    };

    const result = await UserService.updateNotificationSettings(USER_ID, {
      email: { enabled: false, newsletters: true },
      push: { enabled: true, comments: false },
      marketing: true,
    });

    assert.equal(updateDoc.$set['notifications.email.enabled'], false);
    assert.equal(updateDoc.$set['notifications.email.newsletters'], true);
    assert.equal(updateDoc.$set['notifications.push.enabled'], true);
    assert.equal(updateDoc.$set['notifications.push.comments'], false);
    assert.equal(updateDoc.$set['notifications.marketing'], true);
    assert.equal(result.email, false);
    assert.equal(result.push, true);
  });

  it('updateAppearanceSettings/updateContentSettings should persist mapped fields', async () => {
    const updates = [];
    userRepository.userSettingsFindOneAndUpdate = async (_query, update) => {
      updates.push(update);
      if (update.$set['appearance.theme']) {
        return { appearance: { theme: 'dark', fontSize: 'large', compactMode: true } };
      }
      return {
        content: {
          language: 'en',
          contentFilter: 'strict',
          autoplayVideos: false,
          showSensitiveContent: true,
        },
      };
    };

    const appearance = await UserService.updateAppearanceSettings(USER_ID, {
      theme: 'dark',
      fontSize: 'large',
      compactMode: true,
    });
    const content = await UserService.updateContentSettings(USER_ID, {
      language: 'en',
      contentFilter: 'strict',
      autoplayVideos: false,
      showSensitiveContent: true,
    });

    assert.equal(updates[0].$set['appearance.theme'], 'dark');
    assert.equal(updates[0].$set['appearance.fontSize'], 'large');
    assert.equal(updates[0].$set['appearance.compactMode'], true);
    assert.equal(updates[1].$set['content.language'], 'en');
    assert.equal(updates[1].$set['content.contentFilter'], 'strict');
    assert.equal(updates[1].$set['content.autoplayVideos'], false);
    assert.equal(updates[1].$set['content.showSensitiveContent'], true);
    assert.equal(appearance.theme, 'dark');
    assert.equal(content.language, 'en');
  });

  it('muteUser should reject self mute', async () => {
    await assert.rejects(
      UserService.muteUser(USER_ID, USER_ID),
      err => err?.statusCode === 400
    );
  });

  it('getBlockedUsers/getMutedUsers should return empty arrays when settings do not exist', async () => {
    userRepository.userSettingsFindOne = () => ({
      populate() {
        return this;
      },
      lean: async () => null,
    });

    const blockedUsers = await UserService.getBlockedUsers(USER_ID);
    const mutedUsers = await UserService.getMutedUsers(USER_ID);

    assert.deepEqual(blockedUsers, []);
    assert.deepEqual(mutedUsers, []);
  });
});

