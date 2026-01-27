import mongoose from 'mongoose';
import User from '../models/User.js';
import UserSettings from '../models/UserSettings.js';
import Follow from '../models/Follow.js';
import UserInteraction from '../models/UserInteraction.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import SavePost from '../models/SavePost.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import logger from '../configs/logger.js';

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
   * Find user by email (for authentication)
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object with password or null
   * @throws {Error} If email not provided
   */
  static async findUserByEmail(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .lean();

    return user;
  }

  /**
   * Find user by username
   * @param {string} username - User username
   * @returns {Promise<Object|null>} User object or null
   * @throws {Error} If username not provided
   */
  static async getUserByUsername(username) {
    if (!username) {
      throw new Error('Username is required');
    }

    const user = await User.findOne({ username: username.toLowerCase() })
      .select('-loginAttempts')
      .lean();

    return user;
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
      throw new Error('User ID is required');
    }

    const userPromise = User.findById(userId).select('-loginAttempts').lean();
    let followStatusPromise = Promise.resolve('none');
    let isFollowingPromise = Promise.resolve(false);

    if (requesterId && requesterId !== userId.toString()) {
        // We can start checking follow status immediately
        followStatusPromise = Follow.getFollowStatus(requesterId, userId);
        isFollowingPromise = Follow.isFollowing(requesterId, userId); // Actually getFollowStatus might be enough if it returns 'active'
    }

    const [user, followStatusRaw] = await Promise.all([
        userPromise,
        followStatusPromise
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    // Determine isFollowing based on followStatus to avoid redundant DB call if possible, 
    // or use the specific isFollowing result if logic differs (like privacy handling)
    // The original code used both Follow.isFollowing and Follow.getFollowStatus in different blocks.
    // Let's stick to the logic: if private, check isFollowing to decide visibility.
    // If not private, we just need status.
    
    // Simplification: We need 'isFollowing' boolean for private check AND 'followStatus' string for response.
    // Follow.getFollowStatus returns 'active', 'pending', 'none'.
    // So isFollowing === (followStatus === 'active').
    
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
        throw new Error('User not found');
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
      throw new Error('User not found');
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
        if (key === 'birthday' && value) {
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

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-loginAttempts');

    if (!user) {
      throw new Error('User not found');
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
        throw new Error('User not found');
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
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
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
   * Get list of users for chat
   * @param {string} currentUserId - Current user ID
   * @param {Object} options - Pagination options {page, limit}
   * @returns {Promise<Object>} List of conversations
   */
  static async getUsersForChat(currentUserId, options = {}) {
    const { page = 1, limit = 20 } = options;
    return Message.getConversations(currentUserId, { page, limit });
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
  static async acceptFollowRequest(userId, followerId) {
    const result = await Follow.acceptFollowRequest(userId, followerId);

    if (result.success) {
      await Notification.createNotification({
        recipient: followerId,
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
  static async rejectFollowRequest(userId, followerId) {
    return Follow.rejectFollowRequest(userId, followerId);
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
    const [userSettings, user] = await Promise.all([
      UserSettings.getOrCreate(userId),
      User.findById(userId).select('privacy'),
    ]);

    const settings = userSettings.toObject();

    settings.privacy = {
      ...settings.privacy,
      profileVisibility: user.privacy?.profileVisibility || 'public',
      allowMessages: user.privacy?.allowMessages || 'everyone',
      messagePermission: user.privacy?.allowMessages || 'everyone',
      showActivity: user.privacy?.showActivity ?? true,
      activityStatus: user.privacy?.showActivity ?? true,
    };

    if (settings.notifications) {
      const push = settings.notifications.push || {};
      const email = settings.notifications.email || {};

      settings.notifications = {
        likes: push.likes ?? true,
        comments: push.comments ?? true,
        follows: push.follows ?? true,
        messages: push.messages ?? true,
        mentions: push.mentions ?? true,

        push: push.enabled ?? true,
        email: email.enabled ?? true,

        ...settings.notifications,
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

    const settingsUpdate = {};
    if (privacySettings.postVisibility)
      settingsUpdate['privacy.postVisibility'] = privacySettings.postVisibility;
    if (privacySettings.searchable !== undefined)
      settingsUpdate['privacy.searchable'] = privacySettings.searchable;

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
    };

    for (const [key, value] of Object.entries(notificationSettings)) {
      if (key === 'email') {
        if (typeof value === 'boolean') {
          updateOps['notifications.email.enabled'] = value;
        } else if (typeof value === 'object') {
          for (const [subKey, subValue] of Object.entries(value)) {
            updateOps[`notifications.email.${subKey}`] = subValue;
          }
        }
      } else if (key === 'push') {
        if (typeof value === 'boolean') {
          updateOps['notifications.push.enabled'] = value;
        } else if (typeof value === 'object') {
          for (const [subKey, subValue] of Object.entries(value)) {
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
      likes: push.likes,
      comments: push.comments,
      follows: push.follows,
      messages: push.messages,
      mentions: push.mentions,
      push: push.enabled,
      email: email.enabled,
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
    const settings = await UserSettings.findOneAndUpdate(
      { user: userId },
      { $set: { appearance: appearanceSettings } },
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
    const settings = await UserSettings.findOneAndUpdate(
      { user: userId },
      { $set: { content: contentSettings } },
      { new: true, upsert: true }
    );

    return settings.content;
  }

  static async updateProfileSettings(userId, updatedFields, avatarUrl = null) {
    if (avatarUrl) {
      updatedFields.avatar = avatarUrl;
    }
    return this.updateProfile(userId, updatedFields);
  }

  static async updatePreferences(userId, preferences) {
    return this.updateContentSettings(userId, preferences);
  }

  static async updateThemeSettings(userId, themeSettings) {
    return this.updateAppearanceSettings(userId, themeSettings);
  }

  static async updateTwoFactorAuth(userId, twoFactorSettings) {
    return this.updateSecuritySettings(userId, twoFactorSettings);
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
      throw new Error('Cannot block yourself');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new Error('User not found');
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
      throw new Error('Cannot mute yourself');
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
    throw new Error('Invalid action');
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
   * Get list of top users by engagement rate
   * @param {number} limit - Maximum number of users
   * @returns {Promise<Array>} List of top users
   */
  static async getTopUsersByEngagement(limit = 10) {
    return User.find({
      isActive: true,
      'moderation.status': 'active',
    })
      .sort({ 'metrics.engagementRate': -1 })
      .limit(limit)
      .select(
        'username name avatar verified followersCount metrics.engagementRate'
      )
      .lean();
  }

  static async getTopUsersByLikes() {
    return this.getTopUsersByEngagement(10);
  }

  static async getAllUsers(currentUserId) {
    return this.getUsersForChat(currentUserId);
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
      throw new Error(`Kích thước ảnh ${sizeMB}MB vượt quá giới hạn 10MB`);
    }

    const cloudinary = (await import('../configs/cloudinaryConfig.js')).default;

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

  /**
   * Get user by email (alias for findUserByEmail)
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async getUserByEmail(email) {
    return this.findUserByEmail(email);
  }

  static async findProfileByUserId(userId) {
    const user = await User.findById(userId).lean();
    if (!user) return null;
    return {
      userId: user._id,
      avatar: user.avatar,
      bio: user.bio,
      birthday: user.birthday,
      gender: user.gender,
      website: user.website,
      interests: user.interests,
    };
  }

  static async getProfileById(userId) {
    return this.findProfileByUserId(userId);
  }

  static async createProfile(profileData) {
    if (!profileData.userId) throw new Error('UserId required');
    return this.updateProfile(profileData.userId, profileData);
  }

  static async deleteProfile(userId) {
    return this.updateProfile(userId, {
      bio: '',
      website: '',
      interests: [],
      avatar:
        'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
    });
  }
}

export default UserService;
