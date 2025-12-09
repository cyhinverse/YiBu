import { CatchError } from "../configs/CatchError.js";
import UserService from "../services/User.Service.js";
import { formatResponse } from "../helpers/formatResponse.js";

const UserController = {
  // ======================================
  // User Core
  // ======================================

  Get_User_By_Id: CatchError(async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user?.id;

    const user = await UserService.getUserById(id, requesterId);
    return formatResponse(res, 200, 1, "Get user successfully!", user);
  }),

  getUserProfile: CatchError(async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user?.id;

    const profile = await UserService.getUserProfile(id, requesterId);
    return formatResponse(res, 200, 1, "Get profile successfully!", profile);
  }),

  getAllUsers: CatchError(async (req, res) => {
    const currentUserId = req.user.id;
    const users = await UserService.getUsersForChat(currentUserId);
    return formatResponse(res, 200, 1, "Success", users);
  }),

  GET_TOP_USERS_BY_LIKES: CatchError(async (req, res) => {
    const { limit = 10 } = req.query;
    const topUsers = await UserService.getTopUsersByEngagement(parseInt(limit));
    return formatResponse(res, 200, 1, "Get top users successfully", topUsers);
  }),

  getRecommendedUsers: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const users = await UserService.getRecommendedUsers(
      userId,
      parseInt(limit)
    );
    return formatResponse(res, 200, 1, "Success", users);
  }),

  // ======================================
  // Search
  // ======================================

  searchUsers: CatchError(async (req, res) => {
    const { query, page = 1, limit = 20 } = req.query;
    const currentUserId = req.user.id;

    if (!query || query.trim().length < 2) {
      return formatResponse(
        res,
        400,
        0,
        "Search query must be at least 2 characters"
      );
    }

    const result = await UserService.searchUsers(query, currentUserId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return formatResponse(res, 200, 1, "Success", result);
  }),

  // ======================================
  // Follow System
  // ======================================

  checkFollowStatus: CatchError(async (req, res) => {
    const { targetUserId } = req.params;
    const currentUserId = req.user.id;

    const status = await UserService.checkFollowStatus(
      currentUserId,
      targetUserId
    );
    return formatResponse(res, 200, 1, "Success", {
      status,
      isFollowing: status === "active",
    });
  }),

  followUser: CatchError(async (req, res) => {
    const { targetUserId } = req.body;
    const currentUserId = req.user.id;

    if (!targetUserId) {
      return formatResponse(res, 400, 0, "Target user ID is required");
    }

    const result = await UserService.followUser(currentUserId, targetUserId);

    const message =
      result.status === "pending"
        ? "Đã gửi yêu cầu theo dõi"
        : "Theo dõi thành công";

    return formatResponse(res, 200, 1, message, result);
  }),

  unfollowUser: CatchError(async (req, res) => {
    const { targetUserId } = req.body;
    const currentUserId = req.user.id;

    if (!targetUserId) {
      return formatResponse(res, 400, 0, "Target user ID is required");
    }

    const result = await UserService.unfollowUser(currentUserId, targetUserId);
    return formatResponse(res, 200, 1, "Đã hủy theo dõi", result);
  }),

  getFollowers: CatchError(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await UserService.getFollowers(id, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return formatResponse(res, 200, 1, "Success", result);
  }),

  getFollowing: CatchError(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await UserService.getFollowing(id, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return formatResponse(res, 200, 1, "Success", result);
  }),

  getMutualFollowers: CatchError(async (req, res) => {
    const { targetUserId } = req.params;
    const currentUserId = req.user.id;
    const { limit = 10 } = req.query;

    const result = await UserService.getMutualFollowers(
      currentUserId,
      targetUserId,
      parseInt(limit)
    );
    return formatResponse(res, 200, 1, "Success", result);
  }),

  // Follow Requests (for private accounts)
  getPendingFollowRequests: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await UserService.getPendingFollowRequests(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return formatResponse(res, 200, 1, "Success", result);
  }),

  acceptFollowRequest: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { followerId } = req.body;

    if (!followerId) {
      return formatResponse(res, 400, 0, "Follower ID is required");
    }

    const result = await UserService.acceptFollowRequest(userId, followerId);
    return formatResponse(res, 200, 1, "Đã chấp nhận yêu cầu theo dõi", result);
  }),

  rejectFollowRequest: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { followerId } = req.body;

    if (!followerId) {
      return formatResponse(res, 400, 0, "Follower ID is required");
    }

    const result = await UserService.rejectFollowRequest(userId, followerId);
    return formatResponse(res, 200, 1, "Đã từ chối yêu cầu theo dõi", result);
  }),

  // ======================================
  // Profile
  // ======================================

  GET_PROFILE_BY_ID: CatchError(async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user?.id;

    const profile = await UserService.getUserProfile(id, requesterId);
    return formatResponse(res, 200, 0, "Get profile successfully!", profile);
  }),

  updateProfileSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    let avatarUrl = null;

    // Handle avatar upload
    if (req.files?.avatar) {
      const avatar = req.files.avatar;
      avatarUrl = await UserService.uploadAvatarToCloudinary(avatar, userId);
    }

    const profileData = { ...req.body };
    if (avatarUrl) {
      profileData.avatar = avatarUrl;
    }

    const user = await UserService.updateProfile(userId, profileData);
    return formatResponse(
      res,
      200,
      1,
      "Cập nhật thông tin hồ sơ thành công",
      user
    );
  }),

  // ======================================
  // User Settings
  // ======================================

  getUserSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const settings = await UserService.getUserSettings(userId);
    return formatResponse(res, 200, 1, "Success", settings);
  }),

  updatePrivacySettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const privacySettings = {
      profileVisibility: req.body.profileVisibility,
      allowMessages: req.body.allowMessages || req.body.messagePermission,
      showActivity: req.body.showActivity || req.body.activityStatus,
      postVisibility: req.body.postVisibility,
      searchable: req.body.searchable ?? req.body.searchVisibility,
    };

    const updated = await UserService.updatePrivacySettings(
      userId,
      privacySettings
    );
    return formatResponse(
      res,
      200,
      1,
      "Cập nhật cài đặt quyền riêng tư thành công",
      updated
    );
  }),

  updateNotificationSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const settings = {
      likes: req.body.likes,
      comments: req.body.comments,
      follows: req.body.follows ?? req.body.newFollower,
      mentions: req.body.mentions,
      messages: req.body.messages ?? req.body.directMessages,
      shares: req.body.shares,
      email: req.body.email,
      push: req.body.push,
      systemUpdates: req.body.systemUpdates,
    };

    const updated = await UserService.updateNotificationSettings(
      userId,
      settings
    );
    return formatResponse(
      res,
      200,
      1,
      "Cập nhật cài đặt thông báo thành công",
      updated
    );
  }),

  updateSecuritySettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const settings = {
      twoFactorEnabled: req.body.twoFactorEnabled,
      loginAlerts: req.body.loginAlerts,
    };

    const updated = await UserService.updateSecuritySettings(userId, settings);
    return formatResponse(
      res,
      200,
      1,
      "Cập nhật cài đặt bảo mật thành công",
      updated
    );
  }),

  updateContentSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const settings = {
      language: req.body.language,
      autoplay: req.body.autoplay ?? req.body.autoplayEnabled,
      quality: req.body.quality,
      contentFilters: req.body.contentFilters,
    };

    const updated = await UserService.updateContentSettings(userId, settings);
    return formatResponse(
      res,
      200,
      1,
      "Cập nhật cài đặt nội dung thành công",
      updated
    );
  }),

  updateThemeSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const settings = {
      theme: req.body.theme ?? req.body.appearance,
      fontSize: req.body.fontSize,
      colorScheme: req.body.colorScheme ?? req.body.primaryColor,
    };

    const updated = await UserService.updateAppearanceSettings(
      userId,
      settings
    );
    return formatResponse(
      res,
      200,
      1,
      "Cập nhật cài đặt giao diện thành công",
      updated
    );
  }),

  // ======================================
  // Block & Mute
  // ======================================

  blockUser: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { blockedUserId } = req.body;

    if (!blockedUserId) {
      return formatResponse(res, 400, 0, "Thiếu ID người dùng cần chặn");
    }

    await UserService.blockUser(userId, blockedUserId);
    return formatResponse(res, 200, 1, "Chặn người dùng thành công");
  }),

  unblockUser: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { blockedUserId } = req.params;

    if (!blockedUserId) {
      return formatResponse(res, 400, 0, "Thiếu ID người dùng cần bỏ chặn");
    }

    await UserService.unblockUser(userId, blockedUserId);
    return formatResponse(res, 200, 1, "Bỏ chặn người dùng thành công");
  }),

  muteUser: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return formatResponse(res, 400, 0, "Thiếu ID người dùng cần ẩn");
    }

    await UserService.muteUser(userId, targetUserId);
    return formatResponse(res, 200, 1, "Đã ẩn người dùng thành công");
  }),

  unmuteUser: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { targetUserId } = req.params;

    await UserService.unmuteUser(userId, targetUserId);
    return formatResponse(res, 200, 1, "Đã bỏ ẩn người dùng thành công");
  }),

  getBlockList: CatchError(async (req, res) => {
    const userId = req.user.id;
    const blockedUsers = await UserService.getBlockedUsers(userId);
    return formatResponse(res, 200, 1, "Success", blockedUsers);
  }),

  getMuteList: CatchError(async (req, res) => {
    const userId = req.user.id;
    const mutedUsers = await UserService.getMutedUsers(userId);
    return formatResponse(res, 200, 1, "Success", mutedUsers);
  }),

  // ======================================
  // Backward Compatibility / Deprecated
  // ======================================

  addTrustedDevice: CatchError(async (req, res) => {
    // Moved to Auth service - keeping for backward compatibility
    return formatResponse(res, 200, 1, "Feature moved to auth/sessions");
  }),

  removeTrustedDevice: CatchError(async (req, res) => {
    // Moved to Auth service - keeping for backward compatibility
    return formatResponse(res, 200, 1, "Feature moved to auth/sessions");
  }),
};

export default UserController;
