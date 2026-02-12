import mongoose from 'mongoose';
import User from '../../models/User.js';
import UserSettings from '../../models/UserSettings.js';
import Follow from '../../models/Follow.js';
import UserInteraction from '../../models/UserInteraction.js';
import Post from '../../models/Post.js';
import Comment from '../../models/Comment.js';
import Like from '../../models/Like.js';
import SavePost from '../../models/SavePost.js';
import Message from '../../models/Message.js';
import Notification from '../../models/Notification.js';
import logger from '../../configs/logger.js';
import ApiError from '../../helpers/ApiError.js';
import { escapeRegExp } from '../../utils/escapeRegExp.js';


/**
 * User Service - Refactored for new model structure
 *
 * Key Changes:
 * 1. Uses Follow model instead of embedded arrays
 * 2. Uses UserSettings model for settings
 * 3. Leverages denormalized counters
 * 4. Integrates with UserInteraction for recommendations
 */
class UserService {
  /**
   * Check if a string is a valid MongoDB ObjectId
   * @param {string} str - String to check
   * @returns {boolean} True if valid ObjectId
   */
  static isValidObjectId(str) {
    return (
      mongoose.Types.ObjectId.isValid(str) && /^[a-fA-F0-9]{24}$/.test(str)
    );
  }

  /**
   * Convert user ID or username to user ID string
   * @param {string} identifier - User ID or username
   * @returns {Promise<string|null>} User ID as string or null if not found
   */
  static async resolveUserIdOrUsername(identifier) {
    if (!identifier) return null;

    if (this.isValidObjectId(identifier)) {
      const user = await User.findById(identifier).select('_id').lean();
      return user ? user._id.toString() : null;
    }

    const user = await User.findOne({ username: identifier.toLowerCase() })
      .select('_id')
      .lean();

    return user ? user._id.toString() : null;
  }

  /**
   * Get user information by ID with full profile data
   * @param {string} userId - User ID to get
   * @param {string|null} requesterId - Requesting user ID (to check view permissions)
   * @returns {Promise<Object>} User object with follow status
   * @throws {Error} If userId not provided or user not found
   */
  static async getUserById(userId, requesterId = null) {
    if (!userId) {
      throw ApiError.badRequest('User ID is required');
    }

    const userPromise = User.findById(userId).select('-loginAttempts').lean();
    let followStatusPromise = Promise.resolve('none');

    if (requesterId && requesterId !== userId.toString()) {
      followStatusPromise = Follow.getFollowStatus(requesterId, userId);
    }

    const [user, followStatusRaw] = await Promise.all([
      userPromise,
      followStatusPromise,
    ]);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const followStatus = followStatusRaw;
    const isFollowing = followStatus === 'active';

    if (requesterId && requesterId !== userId.toString()) {
      if (user.privacy?.profileVisibility === 'private') {
        if (!isFollowing) {
          return {
            _id: user._id,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            verified: user.verified,
            isPrivate: true,
            followersCount: user.followersCount,
            followingCount: user.followingCount,
          };
        }
      }
    }

    return {
      ...user,
      isFollowing,
      followStatus,
    };
  }

  /**
   * Get user profile with posts and statistics
   * @param {string} userId - User ID
   * @param {string|null} requesterId - Requesting user ID
   * @returns {Promise<Object>} Profile object with recent posts
   */
  static async getUserProfile(userId, requesterId = null) {
    const user = await this.getUserById(userId, requesterId);

    if (user.isPrivate) {
      return user;
    }

    const posts = await Post.find({
      user: userId,
      isDeleted: false,
      visibility:
        requesterId === userId.toString()
          ? { $in: ['public', 'followers', 'private'] }
          : 'public',
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .select('_id caption media likesCount commentsCount createdAt')
      .lean();

    return {
      ...user,
      posts,
    };
  }

  /**
   * Get user profile by ID or username
   * @param {string} identifier - User ID or username
   * @param {string|null} requesterId - Requesting user ID
   * @returns {Promise<Object>} Profile object
   * @throws {Error} If user not found
   */
  static async getUserProfileByIdOrUsername(identifier, requesterId = null) {
    let userId;

    if (this.isValidObjectId(identifier)) {
      userId = identifier;
    } else {
      const user = await User.findOne({ username: identifier.toLowerCase() })
        .select('_id')
        .lean();
    if (!user) {
      throw ApiError.notFound('User not found');
    }

      userId = user._id;
    }

    return this.getUserProfile(userId, requesterId);
  }

  /**
   * Update basic user information
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user object
   * @throws {Error} If user not found
   */
  static async updateUser(userId, updateData) {
    const {
      password,
      email,
      isAdmin,
      verified,
      moderation,
      metrics,
      ...safeData
    } = updateData;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: safeData },
      { new: true, runValidators: true }
    ).select('-loginAttempts');

    if (!user) {
      throw ApiError.notFound('User not found');
    }


    return user;
  }

  /**
   * Update user profile fields
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data (name, bio, birthday, gender, website, avatar, cover, location, interests)
   * @returns {Promise<Object>} Updated user object
   * @throws {Error} If user not found
   */
  static async updateProfile(userId, profileData) {
    const allowedFields = [
      'username',
      'name',
      'bio',
      'birthday',
      'gender',
      'website',
      'avatar',
      'cover',
      'location',
      'interests',
    ];
    const updateData = {};

    for (const [key, value] of Object.entries(profileData)) {
      if (allowedFields.includes(key)) {
        if (key === 'username' && value) {
          updateData[key] = String(value).trim().toLowerCase();
        } else if (key === 'gender' && value === 'prefer_not_to_say') {
          // Keep backward compatibility with older clients while respecting schema enum.
          updateData[key] = 'other';
        } else if (key === 'birthday' && value) {
          updateData[key] = new Date(value);
        } else if (key === 'interests' && typeof value === 'string') {
          updateData[key] = value
            .split(',')
            .map(i => i.trim().toLowerCase())
            .filter(Boolean);
        } else {
          updateData[key] = value;
        }
      }
    }

    let user;
    try {
      user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-loginAttempts');
    } catch (err) {
      // Handle unique index violations cleanly (e.g. username already taken)
      if (err?.code === 11000 && (err?.keyPattern?.username || err?.keyValue?.username)) {
        throw ApiError.badRequest('Username đã được sử dụng', {
          errorCode: 'USERNAME_TAKEN',
        });
      }
      throw err;
    }

    if (!user) {
      throw ApiError.notFound('User not found');
    }


    return user;
  }

  /**
   * Delete user and all related data (posts, comments, likes, follows, messages, notifications)
   * @param {string} userId - User ID to delete
   * @returns {Promise<Object>} Deleted user object
   * @throws {Error} If user not found or error in transaction
   */
  static async deleteUser(userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      const userPosts = await Post.find({ user: userId })
        .select('_id')
        .session(session);
      const postIds = userPosts.map(p => p._id);

      await Promise.all([
        Post.updateMany({ user: userId }, { isDeleted: true }).session(session),
        Comment.updateMany({ user: userId }, { isDeleted: true }).session(
          session
        ),
        Like.deleteMany({ user: userId }).session(session),
        SavePost.deleteMany({ user: userId }).session(session),
        Follow.deleteMany({
          $or: [{ follower: userId }, { following: userId }],
        }).session(session),
        UserInteraction.deleteMany({ user: userId }).session(session),
        Message.deleteMany({
          $or: [{ sender: userId }, { receiver: userId }],
        }).session(session),
        Notification.deleteMany({
          $or: [{ recipient: userId }, { sender: userId }],
        }).session(session),
        UserSettings.deleteOne({ user: userId }).session(session),
        this._updateFollowCountsOnDelete(userId, session),
      ]);

      await User.findByIdAndDelete(userId).session(session);
      await session.commitTransaction();

      logger.info(`User ${userId} deleted successfully`);
      return user;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error deleting user:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async _updateFollowCountsOnDelete(userId, session) {
    const followers = await Follow.find({ following: userId })
      .select('follower')
      .session(session);
    const following = await Follow.find({ follower: userId })
      .select('following')
      .session(session);

    if (followers.length > 0) {
      const followerIds = followers.map(f => f.follower);
      await User.updateMany(
        { _id: { $in: followerIds } },
        { $inc: { followingCount: -1 } }
      ).session(session);
    }

    if (following.length > 0) {
      const followingIds = following.map(f => f.following);
      await User.updateMany(
        { _id: { $in: followingIds } },
        { $inc: { followersCount: -1 } }
      ).session(session);
    }
  }

  /**
   * Search users by query
   * @param {string} query - Search keyword (username or name)
   * @param {string} currentUserId - Searching user ID
   * @param {Object} options - Pagination options {page, limit}
   * @returns {Promise<{users: Array, total: number}>} List of users and total count
   */
  static async searchUsers(query, currentUserId, options = {}) {
    const { page = 1, limit = 20 } = options;

    if (!query || query.trim().length < 2) {
      return { users: [], total: 0 };
    }

    const normalizedQuery = query.trim();
    const safePattern = escapeRegExp(normalizedQuery);

    const settings = await UserSettings.findOne({ user: currentUserId })
      .select('blockedUsers mutedUsers')
      .lean();

    const excludeIds = [
      currentUserId,
      ...(settings?.blockedUsers || []),
      ...(settings?.mutedUsers || []),
    ];

    const searchQuery = {
      _id: { $nin: excludeIds },
      $or: [
        { username: { $regex: safePattern, $options: 'i' } },
        { name: { $regex: safePattern, $options: 'i' } },
      ],
    };

    const [users, total] = await Promise.all([
      User.find(searchQuery)
        .select('username name avatar verified followersCount bio')
        .sort({ 'metrics.engagementRate': -1, followersCount: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(searchQuery),
    ]);

    // Batch fetch follow status
    const userIds = users.map(u => u._id);
    const followingList = await Follow.find({
      follower: currentUserId,
      following: { $in: userIds },
      status: 'active'
    }).select('following').lean();

    const followingSet = new Set(followingList.map(f => f.following.toString()));

    const usersWithStatus = users.map(user => ({
      ...user,
      isFollowing: followingSet.has(user._id.toString())
    }));

    return { users: usersWithStatus, total };
  }

  /**
   * Get list of recommended users
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of users
   * @returns {Promise<Array>} List of recommended users
   */
  static async getRecommendedUsers(userId, limit = 10) {
    return User.getRecommendedUsers(userId, limit);
  }

  /**
   * Follow a user
   * @param {string} currentUserId - Following user ID
   * @param {string} targetUserId - User ID to follow
   * @returns {Promise<Object>} Follow result {success, status}
   */
  static async followUser(currentUserId, targetUserId) {
    const result = await Follow.follow(currentUserId, targetUserId);

    if (result.success && result.status === 'active') {
      const currentUser = await User.findById(currentUserId)
        .select('username name avatar')
        .lean();

      await Notification.createNotification({
        recipient: targetUserId,
        sender: currentUserId,
        type: 'follow',
        content: `${currentUser.username} đã theo dõi bạn`,
        groupKey: `follow_${targetUserId}`,
      });
    }

    return result;
  }

  /**
   * Unfollow a user
   * @param {string} currentUserId - Unfollowing user ID
   * @param {string} targetUserId - User ID to unfollow
   * @returns {Promise<Object>} Unfollow result
   */
  static async unfollowUser(currentUserId, targetUserId) {
    return Follow.unfollow(currentUserId, targetUserId);
  }

  /**
   * Check follow status between 2 users
   * @param {string} currentUserId - Current user ID
   * @param {string} targetUserId - User ID to check
   * @returns {Promise<string>} Follow status (active, pending, none)
   */
  static async checkFollowStatus(currentUserId, targetUserId) {
    return Follow.getFollowStatus(currentUserId, targetUserId);
  }

  /**
   * Get list of followers of a user
   * @param {string} userId - User ID
   * @param {Object} options - Options {page, limit, requesterId}
   * @returns {Promise<Array>} List of followers with isFollowing status
   */
  static async getFollowers(userId, options = {}) {
    const users = await Follow.getFollowers(userId, options);

    if (options.requesterId && users.length > 0) {
      const userIds = users.map(u => u._id);
      const follows = await Follow.find({
        follower: options.requesterId,
        following: { $in: userIds },
        status: 'active',
      })
        .select('following')
        .lean();

      const followingSet = new Set(follows.map(f => f.following.toString()));

      return users.map(user => ({
        ...user,
        isFollowing: followingSet.has(user._id.toString()),
      }));
    }

    return users;
  }

  /**
   * Get list of users that a user is following
   * @param {string} userId - User ID
   * @param {Object} options - Options {page, limit, requesterId}
   * @returns {Promise<Array>} List of following with isFollowing status
   */
  static async getFollowing(userId, options = {}) {
    const users = await Follow.getFollowing(userId, options);

    if (options.requesterId && users.length > 0) {
      const userIds = users.map(u => u._id);
      const follows = await Follow.find({
        follower: options.requesterId,
        following: { $in: userIds },
        status: 'active',
      })
        .select('following')
        .lean();

      const followingSet = new Set(follows.map(f => f.following.toString()));

      return users.map(user => ({
        ...user,
        isFollowing: followingSet.has(user._id.toString()),
      }));
    }

    return users;
  }

  /**
   * Get list of mutual followers between 2 users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @param {number} limit - Maximum count
   * @returns {Promise<Array>} List of mutual followers
   */
  static async getMutualFollowers(userId1, userId2, limit = 10) {
    return Follow.getMutualFollowers(userId1, userId2, limit);
  }

  /**
   * Accept follow request
   * @param {string} userId - User ID receiving the request
   * @param {string} followerId - User ID who sent the request
   * @returns {Promise<Object>} Accept result
   */
  static async acceptFollowRequest(userId, requestIdentifier) {
    const result = await Follow.acceptFollowRequest(userId, requestIdentifier);

    if (result.success) {
      const recipientId = result.follow?.follower || requestIdentifier;
      await Notification.createNotification({
        recipient: recipientId,
        sender: userId,
        type: 'follow',
        content: 'đã chấp nhận yêu cầu theo dõi của bạn',
      });
    }

    return result;
  }

  /**
   * Reject follow request
   * @param {string} userId - User ID receiving the request
   * @param {string} followerId - User ID who sent the request
   * @returns {Promise<Object>} Reject result
   */
  static async rejectFollowRequest(userId, requestIdentifier) {
    return Follow.rejectFollowRequest(userId, requestIdentifier);
  }

  /**
   * Get list of pending follow requests
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Array>} List of pending requests
   */
  static async getPendingFollowRequests(userId, options = {}) {
    return Follow.getPendingRequests(userId, options);
  }

  /**
   * Get all user settings
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Settings object including privacy, notifications, security, appearance
   */
  static async getUserSettings(userId) {
    const user = await User.findById(userId).select('privacy').lean();
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const userSettings = await UserSettings.getOrCreate(userId);

    const settings = userSettings.toObject();

    settings.privacy = {
      ...settings.privacy,
      profileVisibility: user.privacy?.profileVisibility || 'public',
      allowMessages: user.privacy?.allowMessages || 'everyone',
      messagePermission: user.privacy?.allowMessages || 'everyone',
      showActivity: user.privacy?.showActivity ?? true,
      activityStatus: user.privacy?.showActivity ?? true,
      showOnlineStatus: settings.privacy?.showOnlineStatus ?? true,
      allowTagging: settings.privacy?.allowTagging ?? true,
    };

    if (settings.notifications) {
      const push = settings.notifications.push || {};
      const email = settings.notifications.email || {};

      settings.notifications = {
        ...(settings.notifications?.toObject?.() || settings.notifications),
        likes: push.likes ?? true,
        comments: push.comments ?? true,
        follows: push.follows ?? true,
        messages: push.messages ?? true,
        mentions: push.mentions ?? true,
        replies: push.comments ?? true,
        shares: push.shares ?? true,
        saves: push.saves ?? true,
        tags: push.tags ?? true,
        systemUpdates: push.systemUpdates ?? true,
        sound: push.sound ?? true,
        vibration: push.vibration ?? true,

        push: push.enabled ?? true,
        email: email.enabled ?? true,
      };
    }

    return settings;
  }

  /**
   * Update privacy settings
   * @param {string} userId - User ID
   * @param {Object} privacySettings - Privacy settings {profileVisibility, allowMessages, showActivity}
   * @returns {Promise<Object>} Updated privacy settings
   */
  static async updatePrivacySettings(userId, privacySettings) {
    const { profileVisibility, allowMessages, showActivity } = privacySettings;

    const updateData = {};
    if (profileVisibility)
      updateData['privacy.profileVisibility'] = profileVisibility;
    if (allowMessages) updateData['privacy.allowMessages'] = allowMessages;
    if (showActivity !== undefined)
      updateData['privacy.showActivity'] = showActivity;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const settingsUpdate = {};
    if (privacySettings.postVisibility)
      settingsUpdate['privacy.postVisibility'] = privacySettings.postVisibility;
    if (privacySettings.searchable !== undefined)
      settingsUpdate['privacy.searchable'] = privacySettings.searchable;
    if (privacySettings.showOnlineStatus !== undefined)
      settingsUpdate['privacy.showOnlineStatus'] = privacySettings.showOnlineStatus;
    if (privacySettings.allowTagging !== undefined)
      settingsUpdate['privacy.allowTagging'] = privacySettings.allowTagging;
    if (privacySettings.allowMentions !== undefined)
      settingsUpdate['privacy.allowMentions'] = privacySettings.allowMentions;
    if (privacySettings.showEmail !== undefined)
      settingsUpdate['privacy.showEmail'] = privacySettings.showEmail;
    if (privacySettings.showPhone !== undefined)
      settingsUpdate['privacy.showPhone'] = privacySettings.showPhone;
    if (privacySettings.showBirthday !== undefined)
      settingsUpdate['privacy.showBirthday'] = privacySettings.showBirthday;
    if (privacySettings.whoCanSeeFollowers)
      settingsUpdate['privacy.whoCanSeeFollowers'] =
        privacySettings.whoCanSeeFollowers;
    if (privacySettings.whoCanSeeFollowing)
      settingsUpdate['privacy.whoCanSeeFollowing'] =
        privacySettings.whoCanSeeFollowing;
    if (privacySettings.whoCanSeeLikes)
      settingsUpdate['privacy.whoCanSeeLikes'] = privacySettings.whoCanSeeLikes;

    if (Object.keys(settingsUpdate).length > 0) {
      await UserSettings.findOneAndUpdate(
        { user: userId },
        { $set: settingsUpdate },
        { upsert: true }
      );
    }

    const latestUserSettings = await UserSettings.findOne({ user: userId });

    return {
      profileVisibility: user.privacy?.profileVisibility || 'public',
      allowMessages: user.privacy?.allowMessages || 'everyone',
      messagePermission: user.privacy?.allowMessages || 'everyone',
      showActivity: user.privacy?.showActivity ?? true,
      activityStatus: user.privacy?.showActivity ?? true,

      postVisibility: latestUserSettings?.privacy?.postVisibility || 'public',
      searchable: latestUserSettings?.privacy?.searchable ?? true,
      showOnlineStatus: latestUserSettings?.privacy?.showOnlineStatus ?? true,
      allowTagging: latestUserSettings?.privacy?.allowTagging ?? true,
      allowMentions: latestUserSettings?.privacy?.allowMentions ?? true,
      showEmail: latestUserSettings?.privacy?.showEmail ?? false,
      showPhone: latestUserSettings?.privacy?.showPhone ?? false,
      showBirthday: latestUserSettings?.privacy?.showBirthday ?? false,
      whoCanSeeFollowers:
        latestUserSettings?.privacy?.whoCanSeeFollowers || 'everyone',
      whoCanSeeFollowing:
        latestUserSettings?.privacy?.whoCanSeeFollowing || 'everyone',
      whoCanSeeLikes: latestUserSettings?.privacy?.whoCanSeeLikes || 'everyone',
    };
  }

  /**
   * Update notification settings
   * @param {string} userId - User ID
   * @param {Object} notificationSettings - Notification settings {likes, comments, follows, messages, mentions, push, email}
   * @returns {Promise<Object>} Updated notification settings
   */
  static async updateNotificationSettings(userId, notificationSettings) {
    const updateOps = {};

    const keyMapping = {
      likes: 'notifications.push.likes',
      comments: 'notifications.push.comments',
      follows: 'notifications.push.follows',
      messages: 'notifications.push.messages',
      mentions: 'notifications.push.mentions',
      replies: 'notifications.push.comments',
      shares: 'notifications.push.shares',
      saves: 'notifications.push.saves',
      tags: 'notifications.push.tags',
      systemUpdates: 'notifications.push.systemUpdates',
      sound: 'notifications.push.sound',
      vibration: 'notifications.push.vibration',
    };

    for (const [key, value] of Object.entries(notificationSettings)) {
      if (value === undefined) continue;

      if (key === 'email') {
        if (typeof value === 'boolean') {
          updateOps['notifications.email.enabled'] = value;
        } else if (typeof value === 'object') {
          for (const [subKey, subValue] of Object.entries(value)) {
            if (subValue === undefined) continue;
            updateOps[`notifications.email.${subKey}`] = subValue;
          }
        }
      } else if (key === 'push') {
        if (typeof value === 'boolean') {
          updateOps['notifications.push.enabled'] = value;
        } else if (typeof value === 'object') {
          for (const [subKey, subValue] of Object.entries(value)) {
            if (subValue === undefined) continue;
            updateOps[`notifications.push.${subKey}`] = subValue;
          }
        }
      } else if (keyMapping[key]) {
        updateOps[keyMapping[key]] = value;
      } else {
        updateOps[`notifications.${key}`] = value;
      }
    }

    const settings = await UserSettings.findOneAndUpdate(
      { user: userId },
      { $set: updateOps },
      { new: true, upsert: true }
    );

    const push = settings.notifications?.push || {};
    const email = settings.notifications?.email || {};

    return {
      ...(settings.notifications?.toObject?.() || settings.notifications),
      likes: push.likes ?? true,
      comments: push.comments ?? true,
      follows: push.follows ?? true,
      messages: push.messages ?? true,
      mentions: push.mentions ?? true,
      replies: push.comments ?? true,
      shares: push.shares ?? true,
      saves: push.saves ?? true,
      tags: push.tags ?? true,
      systemUpdates: push.systemUpdates ?? true,
      sound: push.sound ?? true,
      vibration: push.vibration ?? true,
      push: push.enabled ?? true,
      email: email.enabled ?? true,
    };
  }

  /**
   * Update security settings
   * @param {string} userId - User ID
   * @param {Object} securitySettings - Security settings {twoFactorEnabled, loginAlerts}
   * @returns {Promise<Object>} Updated security settings
   */
  static async updateSecuritySettings(userId, securitySettings) {
    const { twoFactorEnabled, loginAlerts } = securitySettings;

    const updateData = {};
    if (twoFactorEnabled !== undefined)
      updateData['security.twoFactorEnabled'] = twoFactorEnabled;
    if (loginAlerts !== undefined)
      updateData['security.loginAlerts'] = loginAlerts;

    const settings = await UserSettings.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return settings.security;
  }

  /**
   * Update appearance settings
   * @param {string} userId - User ID
   * @param {Object} appearanceSettings - Appearance settings {theme, fontSize, language}
   * @returns {Promise<Object>} Updated appearance settings
   */
  static async updateAppearanceSettings(userId, appearanceSettings) {
    const allowedFields = ['theme', 'fontSize', 'compactMode'];
    const updateOps = {};

    allowedFields.forEach(field => {
      if (appearanceSettings[field] !== undefined) {
        updateOps[`appearance.${field}`] = appearanceSettings[field];
      }
    });

    if (Object.keys(updateOps).length === 0) {
      const existing = await UserSettings.getOrCreate(userId);
      return existing.appearance;
    }

    const settings = await UserSettings.findOneAndUpdate(
      { user: userId },
      { $set: updateOps },
      { new: true, upsert: true }
    );

    return settings.appearance;
  }

  /**
   * Update content settings
   * @param {string} userId - User ID
   * @param {Object} contentSettings - Content settings {autoplayVideos, showSensitiveContent}
   * @returns {Promise<Object>} Updated content settings
   */
  static async updateContentSettings(userId, contentSettings) {
    const allowedFields = [
      'language',
      'contentFilter',
      'autoplayVideos',
      'showSensitiveContent',
    ];
    const updateOps = {};

    allowedFields.forEach(field => {
      if (contentSettings[field] !== undefined) {
        updateOps[`content.${field}`] = contentSettings[field];
      }
    });

    if (Object.keys(updateOps).length === 0) {
      const existing = await UserSettings.getOrCreate(userId);
      return existing.content;
    }

    const settings = await UserSettings.findOneAndUpdate(
      { user: userId },
      { $set: updateOps },
      { new: true, upsert: true }
    );

    return settings.content;
  }

  /**
   * Block a user
   * @param {string} userId - User ID performing the block
   * @param {string} targetUserId - User ID to block
   * @returns {Promise<{success: boolean}>} Block result
   * @throws {Error} If blocking self or user not found
   */
  static async blockUser(userId, targetUserId) {
    if (userId === targetUserId) {
      throw ApiError.badRequest('Cannot block yourself');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw ApiError.notFound('User not found');
    }



    await UserSettings.findOneAndUpdate(
      { user: userId },
      { $addToSet: { blockedUsers: targetUserId } },
      { upsert: true }
    );

    await Promise.all([
      Follow.unfollow(userId, targetUserId),
      Follow.unfollow(targetUserId, userId),
    ]);

    await UserInteraction.record({
      user: userId,
      targetType: 'user',
      targetId: targetUserId,
      interactionType: 'block',
    });

    return { success: true };
  }

  /**
   * Unblock a user
   * @param {string} userId - User ID performing the unblock
   * @param {string} targetUserId - User ID to unblock
   * @returns {Promise<{success: boolean}>} Unblock result
   */
  static async unblockUser(userId, targetUserId) {
    await UserSettings.findOneAndUpdate(
      { user: userId },
      { $pull: { blockedUsers: targetUserId } }
    );

    return { success: true };
  }

  /**
   * Mute a user (hide their content)
   * @param {string} userId - User ID performing the mute
   * @param {string} targetUserId - User ID to mute
   * @returns {Promise<{success: boolean}>} Mute result
   * @throws {Error} If muting self
   */
  static async muteUser(userId, targetUserId) {
    if (userId === targetUserId) {
      throw ApiError.badRequest('Cannot mute yourself');
    }


    await UserSettings.findOneAndUpdate(
      { user: userId },
      { $addToSet: { mutedUsers: targetUserId } },
      { upsert: true }
    );

    await UserInteraction.record({
      user: userId,
      targetType: 'user',
      targetId: targetUserId,
      interactionType: 'mute',
    });

    return { success: true };
  }

  /**
   * Unmute a user
   * @param {string} userId - User ID performing the unmute
   * @param {string} targetUserId - User ID to unmute
   * @returns {Promise<{success: boolean}>} Unmute result
   */
  static async unmuteUser(userId, targetUserId) {
    await UserSettings.findOneAndUpdate(
      { user: userId },
      { $pull: { mutedUsers: targetUserId } }
    );

    return { success: true };
  }

  /**
   * Get list of blocked users
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of blocked users with basic info
   */
  static async getBlockedUsers(userId) {
    const settings = await UserSettings.findOne({ user: userId })
      .populate('blockedUsers', 'username name avatar')
      .lean();

    return settings?.blockedUsers || [];
  }

  /**
   * Get list of muted users
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of muted users with basic info
   */
  static async getMutedUsers(userId) {
    const settings = await UserSettings.findOne({ user: userId })
      .populate('mutedUsers', 'username name avatar')
      .lean();

    return settings?.mutedUsers || [];
  }

  /**
   * Check if a user is blocked
   * @param {string} userId - Checking user ID
   * @param {string} targetUserId - User ID to check
   * @returns {Promise<boolean>} True if blocked
   */
  static async isBlocked(userId, targetUserId) {
    return UserSettings.isBlocked(userId, targetUserId);
  }

  static async updateBlockedUsers(userId, action, blockedUserId) {
    if (action === 'block') {
      return this.blockUser(userId, blockedUserId);
    } else if (action === 'unblock') {
      return this.unblockUser(userId, blockedUserId);
    }
    throw ApiError.badRequest('Invalid action');

  }

  /**
   * Update user last active time
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async updateLastActive(userId) {
    await User.findByIdAndUpdate(userId, { lastActiveAt: new Date() });
  }

  /**
   * Update user engagement metrics
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async updateUserMetrics(userId) {
    const user = await User.findById(userId);
    if (user) {
      await user.updateEngagementMetrics();
    }
  }


  /**
   * Upload avatar to Cloudinary and update user
   * @param {Object} avatar - Avatar file {tempFilePath, size}
   * @param {string} userId - User ID
   * @returns {Promise<string>} Uploaded avatar URL
   * @throws {Error} If file exceeds 10MB
   */
  static async uploadAvatarToCloudinary(avatar, userId) {
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    if (avatar.size > MAX_FILE_SIZE) {
      const sizeMB = (avatar.size / (1024 * 1024)).toFixed(2);
      throw ApiError.badRequest(
        `Kích thước ảnh ${sizeMB}MB vượt quá giới hạn 10MB`
      );

    }

    const cloudinary = (await import('../../configs/cloudinaryConfig.js')).default;

    const result = await cloudinary.uploader.upload(avatar.tempFilePath, {
      folder: 'avatars',
      public_id: `avatar_${userId}_${Date.now()}`,
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto' },
      ],
    });

    await User.findByIdAndUpdate(userId, { avatar: result.secure_url });

    return result.secure_url;
  }

  /**
   * Create new user (for registration)
   * @param {Object} userData - User data {name, email, password, username}
   * @returns {Promise<Object>} Created user object
   */
  static async createUser(userData) {
    const { name, email, password, username } = userData;

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      username: username.toLowerCase(),
    });

    await UserSettings.create({ user: user._id });

    return user;
  }
}

export default UserService;



