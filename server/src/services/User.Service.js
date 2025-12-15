import mongoose from "mongoose";
import User from "../models/User.js";
import UserSettings from "../models/UserSettings.js";
import Follow from "../models/Follow.js";
import UserInteraction from "../models/UserInteraction.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Like from "../models/Like.js";
import SavePost from "../models/SavePost.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import logger from "../configs/logger.js";

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
  // ======================================
  // User Core Methods
  // ======================================

  /**
   * Find user by email (for auth)
   */
  static async findUserByEmail(email) {
    if (!email) {
      throw new Error("Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select("+password")
      .lean();

    return user;
  }

  /**
   * Find user by username
   */
  static async getUserByUsername(username) {
    if (!username) {
      throw new Error("Username is required");
    }

    const user = await User.findOne({ username: username.toLowerCase() })
      .select("-loginAttempts")
      .lean();

    return user;
  }

  /**
   * Get user by ID with full profile data
   */
  static async getUserById(userId, requesterId = null) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const user = await User.findById(userId).select("-loginAttempts").lean();

    if (!user) {
      throw new Error("User not found");
    }

    // Check privacy settings if requester is different user
    if (requesterId && requesterId !== userId.toString()) {
      if (user.privacy?.profileVisibility === "private") {
        const isFollowing = await Follow.isFollowing(requesterId, userId);
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

    // Get follow status if requester provided
    let isFollowing = false;
    let followStatus = "none";
    if (requesterId && requesterId !== userId.toString()) {
      followStatus = await Follow.getFollowStatus(requesterId, userId);
      isFollowing = followStatus === "active";
    }

    return {
      ...user,
      isFollowing,
      followStatus,
    };
  }

  /**
   * Get user profile with posts and stats
   */
  static async getUserProfile(userId, requesterId = null) {
    const user = await this.getUserById(userId, requesterId);

    if (user.isPrivate) {
      return user;
    }

    // Get recent posts
    const posts = await Post.find({
      user: userId,
      isDeleted: false,
      visibility:
        requesterId === userId.toString()
          ? { $in: ["public", "followers", "private"] }
          : "public",
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .select("_id caption media likesCount commentsCount createdAt")
      .lean();

    return {
      ...user,
      posts,
    };
  }

  /**
   * Update user basic info
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
    ).select("-loginAttempts");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Update user profile fields
   */
  static async updateProfile(userId, profileData) {
    const allowedFields = [
      "name",
      "bio",
      "birthday",
      "gender",
      "website",
      "avatar",
      "cover",
      "location",
      "interests",
    ];
    const updateData = {};

    for (const [key, value] of Object.entries(profileData)) {
      if (allowedFields.includes(key)) {
        if (key === "birthday" && value) {
          updateData[key] = new Date(value);
        } else if (key === "interests" && typeof value === "string") {
          updateData[key] = value
            .split(",")
            .map((i) => i.trim().toLowerCase())
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
    ).select("-loginAttempts");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Delete user and all associated data
   */
  static async deleteUser(userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new Error("User not found");
      }

      // Get all user's posts for cleanup
      const userPosts = await Post.find({ user: userId })
        .select("_id")
        .session(session);
      const postIds = userPosts.map((p) => p._id);

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
      logger.error("Error deleting user:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async _updateFollowCountsOnDelete(userId, session) {
    const followers = await Follow.find({ following: userId })
      .select("follower")
      .session(session);
    const following = await Follow.find({ follower: userId })
      .select("following")
      .session(session);

    if (followers.length > 0) {
      const followerIds = followers.map((f) => f.follower);
      await User.updateMany(
        { _id: { $in: followerIds } },
        { $inc: { followingCount: -1 } }
      ).session(session);
    }

    if (following.length > 0) {
      const followingIds = following.map((f) => f.following);
      await User.updateMany(
        { _id: { $in: followingIds } },
        { $inc: { followersCount: -1 } }
      ).session(session);
    }
  }

  // ======================================
  // Search & Discovery
  // ======================================

  static async searchUsers(query, currentUserId, options = {}) {
    const { page = 1, limit = 20 } = options;

    if (!query || query.trim().length < 2) {
      return { users: [], total: 0 };
    }

    const settings = await UserSettings.findOne({ user: currentUserId })
      .select("blockedUsers mutedUsers")
      .lean();

    const excludeIds = [
      currentUserId,
      ...(settings?.blockedUsers || []),
      ...(settings?.mutedUsers || []),
    ];

    const searchQuery = {
      _id: { $nin: excludeIds },
      isActive: true,
      "moderation.status": "active",
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    };

    const [users, total] = await Promise.all([
      User.find(searchQuery)
        .select("username name avatar verified followersCount bio")
        .sort({ "metrics.engagementRate": -1, followersCount: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(searchQuery),
    ]);

    const usersWithStatus = await Promise.all(
      users.map(async (user) => ({
        ...user,
        isFollowing: await Follow.isFollowing(currentUserId, user._id),
      }))
    );

    return { users: usersWithStatus, total };
  }

  static async getRecommendedUsers(userId, limit = 10) {
    return User.getRecommendedUsers(userId, limit);
  }

  static async getUsersForChat(currentUserId, options = {}) {
    const { page = 1, limit = 20 } = options;
    return Message.getConversations(currentUserId, { page, limit });
  }

  // ======================================
  // Follow System
  // ======================================

  static async followUser(currentUserId, targetUserId) {
    const result = await Follow.follow(currentUserId, targetUserId);

    if (result.success && result.status === "active") {
      const currentUser = await User.findById(currentUserId)
        .select("username name avatar")
        .lean();

      await Notification.createNotification({
        recipient: targetUserId,
        sender: currentUserId,
        type: "follow",
        content: `${currentUser.username} đã theo dõi bạn`,
        groupKey: `follow_${targetUserId}`,
      });
    }

    return result;
  }

  static async unfollowUser(currentUserId, targetUserId) {
    return Follow.unfollow(currentUserId, targetUserId);
  }

  static async checkFollowStatus(currentUserId, targetUserId) {
    return Follow.getFollowStatus(currentUserId, targetUserId);
  }

  static async getFollowers(userId, options = {}) {
    return Follow.getFollowers(userId, options);
  }

  static async getFollowing(userId, options = {}) {
    return Follow.getFollowing(userId, options);
  }

  static async getMutualFollowers(userId1, userId2, limit = 10) {
    return Follow.getMutualFollowers(userId1, userId2, limit);
  }

  static async acceptFollowRequest(userId, followerId) {
    const result = await Follow.acceptFollowRequest(userId, followerId);

    if (result.success) {
      await Notification.createNotification({
        recipient: followerId,
        sender: userId,
        type: "follow",
        content: "đã chấp nhận yêu cầu theo dõi của bạn",
      });
    }

    return result;
  }

  static async rejectFollowRequest(userId, followerId) {
    return Follow.rejectFollowRequest(userId, followerId);
  }

  static async getPendingFollowRequests(userId, options = {}) {
    return Follow.getPendingRequests(userId, options);
  }

  // ======================================
  // User Settings
  // ======================================

  static async getUserSettings(userId) {
    return UserSettings.getOrCreate(userId);
  }

  static async updatePrivacySettings(userId, privacySettings) {
    const { profileVisibility, allowMessages, showActivity } = privacySettings;

    const updateData = {};
    if (profileVisibility)
      updateData["privacy.profileVisibility"] = profileVisibility;
    if (allowMessages) updateData["privacy.allowMessages"] = allowMessages;
    if (showActivity !== undefined)
      updateData["privacy.showActivity"] = showActivity;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );

    const settingsUpdate = {};
    if (privacySettings.postVisibility)
      settingsUpdate["privacy.postVisibility"] = privacySettings.postVisibility;
    if (privacySettings.searchable !== undefined)
      settingsUpdate["privacy.searchable"] = privacySettings.searchable;

    if (Object.keys(settingsUpdate).length > 0) {
      await UserSettings.findOneAndUpdate(
        { user: userId },
        { $set: settingsUpdate },
        { upsert: true }
      );
    }

    return user?.privacy;
  }

  static async updateNotificationSettings(userId, notificationSettings) {
    const settings = await UserSettings.findOneAndUpdate(
      { user: userId },
      { $set: { notifications: notificationSettings } },
      { new: true, upsert: true }
    );

    return settings.notifications;
  }

  static async updateSecuritySettings(userId, securitySettings) {
    const { twoFactorEnabled, loginAlerts } = securitySettings;

    const updateData = {};
    if (twoFactorEnabled !== undefined)
      updateData["security.twoFactorEnabled"] = twoFactorEnabled;
    if (loginAlerts !== undefined)
      updateData["security.loginAlerts"] = loginAlerts;

    const settings = await UserSettings.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return settings.security;
  }

  static async updateAppearanceSettings(userId, appearanceSettings) {
    const settings = await UserSettings.findOneAndUpdate(
      { user: userId },
      { $set: { appearance: appearanceSettings } },
      { new: true, upsert: true }
    );

    return settings.appearance;
  }

  static async updateContentSettings(userId, contentSettings) {
    const settings = await UserSettings.findOneAndUpdate(
      { user: userId },
      { $set: { content: contentSettings } },
      { new: true, upsert: true }
    );

    return settings.content;
  }

  // Alias methods for backward compatibility
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

  // ======================================
  // Block & Mute
  // ======================================

  static async blockUser(userId, targetUserId) {
    if (userId === targetUserId) {
      throw new Error("Cannot block yourself");
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new Error("User not found");
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
      targetType: "user",
      targetId: targetUserId,
      interactionType: "block",
    });

    return { success: true };
  }

  static async unblockUser(userId, targetUserId) {
    await UserSettings.findOneAndUpdate(
      { user: userId },
      { $pull: { blockedUsers: targetUserId } }
    );

    return { success: true };
  }

  static async muteUser(userId, targetUserId) {
    if (userId === targetUserId) {
      throw new Error("Cannot mute yourself");
    }

    await UserSettings.findOneAndUpdate(
      { user: userId },
      { $addToSet: { mutedUsers: targetUserId } },
      { upsert: true }
    );

    await UserInteraction.record({
      user: userId,
      targetType: "user",
      targetId: targetUserId,
      interactionType: "mute",
    });

    return { success: true };
  }

  static async unmuteUser(userId, targetUserId) {
    await UserSettings.findOneAndUpdate(
      { user: userId },
      { $pull: { mutedUsers: targetUserId } }
    );

    return { success: true };
  }

  static async getBlockedUsers(userId) {
    const settings = await UserSettings.findOne({ user: userId })
      .populate("blockedUsers", "username name avatar")
      .lean();

    return settings?.blockedUsers || [];
  }

  static async getMutedUsers(userId) {
    const settings = await UserSettings.findOne({ user: userId })
      .populate("mutedUsers", "username name avatar")
      .lean();

    return settings?.mutedUsers || [];
  }

  static async isBlocked(userId, targetUserId) {
    return UserSettings.isBlocked(userId, targetUserId);
  }

  // Alias for backward compatibility
  static async updateBlockedUsers(userId, action, blockedUserId) {
    if (action === "block") {
      return this.blockUser(userId, blockedUserId);
    } else if (action === "unblock") {
      return this.unblockUser(userId, blockedUserId);
    }
    throw new Error("Invalid action");
  }

  // ======================================
  // Activity & Metrics
  // ======================================

  static async updateLastActive(userId) {
    await User.findByIdAndUpdate(userId, { lastActiveAt: new Date() });
  }

  static async updateUserMetrics(userId) {
    const user = await User.findById(userId);
    if (user) {
      await user.updateEngagementMetrics();
    }
  }

  static async getTopUsersByEngagement(limit = 10) {
    return User.find({
      isActive: true,
      "moderation.status": "active",
    })
      .sort({ "metrics.engagementRate": -1 })
      .limit(limit)
      .select(
        "username name avatar verified followersCount metrics.engagementRate"
      )
      .lean();
  }

  // Alias for backward compatibility
  static async getTopUsersByLikes() {
    return this.getTopUsersByEngagement(10);
  }

  static async getAllUsers(currentUserId) {
    return this.getUsersForChat(currentUserId);
  }

  // ======================================
  // Avatar Upload
  // ======================================

  static async uploadAvatarToCloudinary(avatar, userId) {
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    if (avatar.size > MAX_FILE_SIZE) {
      const sizeMB = (avatar.size / (1024 * 1024)).toFixed(2);
      throw new Error(`Kích thước ảnh ${sizeMB}MB vượt quá giới hạn 10MB`);
    }

    const cloudinary = (await import("../configs/cloudinaryConfig.js")).default;

    const result = await cloudinary.uploader.upload(avatar.tempFilePath, {
      folder: "avatars",
      public_id: `avatar_${userId}_${Date.now()}`,
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "fill" },
        { quality: "auto" },
      ],
    });

    await User.findByIdAndUpdate(userId, { avatar: result.secure_url });

    return result.secure_url;
  }

  // ======================================
  // User Creation (for Auth)
  // ======================================

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

  static async getUserByEmail(email) {
    return this.findUserByEmail(email);
  }

  // Profile methods aliases
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
    if (!profileData.userId) throw new Error("UserId required");
    return this.updateProfile(profileData.userId, profileData);
  }

  static async deleteProfile(userId) {
    return this.updateProfile(userId, {
      bio: "",
      website: "",
      interests: [],
      avatar:
        "https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1",
    });
  }
}

export default UserService;
