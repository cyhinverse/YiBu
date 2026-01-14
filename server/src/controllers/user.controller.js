import { CatchError } from '../configs/CatchError.js';
import UserService from '../services/User.Service.js';
import { formatResponse } from '../helpers/formatResponse.js';
import logger from '../configs/logger.js';

/**
 * User Controller
 * Handle all user-related requests
 *
 * Main features:
 * - User profile management
 * - User search and suggestions
 * - Follow/unfollow system
 * - User settings (privacy, notifications, security)
 * - Block and mute users
 */
const UserController = {
  /**
   * Get user by ID
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.id - User ID to retrieve
   * @param {Object} [req.user] - Authenticated user object (optional)
   * @param {string} [req.user.id] - Current user's ID for context
   * @param {Object} res - Express response object
   * @returns {Object} Response with user data
   */
  Get_User_By_Id: CatchError(async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user?.id;

    const user = await UserService.getUserById(id, requesterId);
    return formatResponse(res, 200, 1, 'Get user successfully!', user);
  }),

  /**
   * Get user profile by ID
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.id - User ID to retrieve profile
   * @param {Object} [req.user] - Authenticated user object (optional)
   * @param {string} [req.user.id] - Current user's ID for context
   * @param {Object} res - Express response object
   * @returns {Object} Response with user profile data
   */
  getUserProfile: CatchError(async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user?.id;

    const profile = await UserService.getUserProfile(id, requesterId);
    return formatResponse(res, 200, 1, 'Get profile successfully!', profile);
  }),

  /**
   * Get all users for chat
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with list of users available for chat
   */
  getAllUsers: CatchError(async (req, res) => {
    const currentUserId = req.user.id;
    const users = await UserService.getUsersForChat(currentUserId);
    return formatResponse(res, 200, 1, 'Success', users);
  }),

  /**
   * Get top users by engagement/likes
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.limit=10] - Maximum number of users to return
   * @param {Object} res - Express response object
   * @returns {Object} Response with list of top engaged users
   */
  GET_TOP_USERS_BY_LIKES: CatchError(async (req, res) => {
    const { limit = 10 } = req.query;
    const topUsers = await UserService.getTopUsersByEngagement(parseInt(limit));
    return formatResponse(res, 200, 1, 'Get top users successfully', topUsers);
  }),

  /**
   * Get recommended users for current user
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.limit=10] - Maximum number of users to return
   * @param {Object} res - Express response object
   * @returns {Object} Response with list of recommended users
   */
  getRecommendedUsers: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const users = await UserService.getRecommendedUsers(
      userId,
      parseInt(limit)
    );
    return formatResponse(res, 200, 1, 'Success', users);
  }),

  /**
   * Search users by query string
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {string} [req.query.q] - Search query string
   * @param {string} [req.query.query] - Alternative search query string
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of results per page
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated search results
   */
  searchUsers: CatchError(async (req, res) => {
    const { q, query, page = 1, limit = 20 } = req.query;
    const currentUserId = req.user.id;
    const searchQuery = q || query;

    if (!searchQuery || searchQuery.trim().length < 2) {
      return formatResponse(
        res,
        400,
        0,
        'Search query must be at least 2 characters'
      );
    }

    const result = await UserService.searchUsers(searchQuery, currentUserId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return formatResponse(res, 200, 1, 'Success', result);
  }),

  /**
   * Check follow status between current user and target user
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.targetUserId - Target user ID or username
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with follow status (active/pending/none) and isFollowing boolean
   */
  checkFollowStatus: CatchError(async (req, res) => {
    const { targetUserId } = req.params;
    const currentUserId = req.user.id;

    const resolvedTargetId = await UserService.resolveUserIdOrUsername(
      targetUserId
    );
    if (!resolvedTargetId) {
      return formatResponse(res, 404, 0, 'Người dùng không tồn tại');
    }

    const status = await UserService.checkFollowStatus(
      currentUserId,
      resolvedTargetId
    );
    return formatResponse(res, 200, 1, 'Success', {
      status,
      isFollowing: status === 'active',
    });
  }),

  /**
   * Follow a user
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.targetUserId - Target user ID or username to follow
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with follow result (status: active/pending)
   */
  followUser: CatchError(async (req, res) => {
    const { targetUserId } = req.body;
    const currentUserId = req.user.id;

    if (!targetUserId) {
      return formatResponse(res, 400, 0, 'Target user ID is required');
    }

    const resolvedTargetId = await UserService.resolveUserIdOrUsername(
      targetUserId
    );
    const result = await UserService.followUser(
      currentUserId,
      resolvedTargetId
    );

    const message =
      result.status === 'pending'
        ? 'Đã gửi yêu cầu theo dõi'
        : 'Theo dõi thành công';

    return formatResponse(res, 200, 1, message, result);
  }),

  /**
   * Unfollow a user
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.targetUserId - Target user ID or username to unfollow
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with unfollow result
   */
  unfollowUser: CatchError(async (req, res) => {
    const { targetUserId } = req.body;
    const currentUserId = req.user.id;

    if (!targetUserId) {
      return formatResponse(res, 400, 0, 'Target user ID is required');
    }

    const resolvedTargetId = await UserService.resolveUserIdOrUsername(
      targetUserId
    );
    const result = await UserService.unfollowUser(
      currentUserId,
      resolvedTargetId
    );
    return formatResponse(res, 200, 1, 'Đã hủy theo dõi', result);
  }),

  /**
   * Get followers list for a user
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.userId - User ID to get followers for
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of results per page
   * @param {Object} [req.user] - Authenticated user object (optional)
   * @param {string} [req.user.id] - Current user's ID for context
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated followers list
   */
  getFollowers: CatchError(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const requesterId = req.user?._id || req.user?.id;

    const result = await UserService.getFollowers(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      requesterId,
    });
    return formatResponse(res, 200, 1, 'Success', result);
  }),

  /**
   * Get following list for a user
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.userId - User ID to get following list for
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of results per page
   * @param {Object} [req.user] - Authenticated user object (optional)
   * @param {string} [req.user.id] - Current user's ID for context
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated following list
   */
  getFollowing: CatchError(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const requesterId = req.user?._id || req.user?.id;

    const result = await UserService.getFollowing(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      requesterId,
    });
    return formatResponse(res, 200, 1, 'Success', result);
  }),

  /**
   * Get mutual followers between current user and target user
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.targetUserId - Target user ID to find mutual followers with
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.limit=10] - Maximum number of mutual followers to return
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with list of mutual followers
   */
  getMutualFollowers: CatchError(async (req, res) => {
    const { targetUserId } = req.params;
    const currentUserId = req.user.id;
    const { limit = 10 } = req.query;

    const result = await UserService.getMutualFollowers(
      currentUserId,
      targetUserId,
      parseInt(limit)
    );
    return formatResponse(res, 200, 1, 'Success', result);
  }),

  /**
   * Get pending follow requests for current user
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of results per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated pending follow requests
   */
  getPendingFollowRequests: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await UserService.getPendingFollowRequests(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return formatResponse(res, 200, 1, 'Success', result);
  }),

  /**
   * Accept a follow request
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.followerId - ID of the user who sent the follow request
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with accept follow request result
   */
  acceptFollowRequest: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { followerId } = req.body;

    if (!followerId) {
      return formatResponse(res, 400, 0, 'Follower ID is required');
    }

    const result = await UserService.acceptFollowRequest(userId, followerId);
    return formatResponse(res, 200, 1, 'Đã chấp nhận yêu cầu theo dõi', result);
  }),

  /**
   * Reject a follow request
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.followerId - ID of the user who sent the follow request
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with reject follow request result
   */
  rejectFollowRequest: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { followerId } = req.body;

    if (!followerId) {
      return formatResponse(res, 400, 0, 'Follower ID is required');
    }

    const result = await UserService.rejectFollowRequest(userId, followerId);
    return formatResponse(res, 200, 1, 'Đã từ chối yêu cầu theo dõi', result);
  }),

  /**
   * Get profile by user ID or username
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.id - User ID or username
   * @param {Object} [req.user] - Authenticated user object (optional)
   * @param {string} [req.user.id] - Current user's ID for context
   * @param {Object} res - Express response object
   * @returns {Object} Response with user profile data
   */
  GET_PROFILE_BY_ID: CatchError(async (req, res) => {
    const { id } = req.params;
    logger.info(`Fetching profile for user ID or username: ${id}`);
    const requesterId = req.user?.id;

    const profile = await UserService.getUserProfileByIdOrUsername(
      id,
      requesterId
    );
    return formatResponse(res, 200, 0, 'Get profile successfully!', profile);
  }),

  /**
   * Update user profile settings
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body with profile data
   * @param {string} [req.body.name] - User's display name
   * @param {string} [req.body.bio] - User's biography
   * @param {string} [req.body.website] - User's website URL
   * @param {Object} [req.files] - Uploaded files from multer memory storage
   * @param {Array} [req.files.avatar] - Avatar image file
   * @param {Array} [req.files.cover] - Cover image file
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated user profile
   */
  updateProfileSettings: CatchError(async (req, res) => {
    const { uploadToCloudinary } = await import(
      '../middlewares/multerUpload.js'
    );
    const userId = req.user.id;
    const profileData = { ...req.body };

    if (req.files?.avatar && req.files.avatar[0]) {
      const avatarFile = req.files.avatar[0];
      const result = await uploadToCloudinary(avatarFile.buffer, {
        folder: 'avatars',
        publicId: `avatar_${userId}_${Date.now()}`,
        transformation: [{ width: 400, height: 400, crop: 'fill' }],
      });
      profileData.avatar = result.secure_url;
    }

    if (req.files?.cover && req.files.cover[0]) {
      const coverFile = req.files.cover[0];
      const result = await uploadToCloudinary(coverFile.buffer, {
        folder: 'covers',
        publicId: `cover_${userId}_${Date.now()}`,
        transformation: [{ width: 1500, height: 500, crop: 'fill' }],
      });
      profileData.cover = result.secure_url;
    }

    const user = await UserService.updateProfile(userId, profileData);
    return formatResponse(
      res,
      200,
      1,
      'Cập nhật thông tin hồ sơ thành công',
      user
    );
  }),

  /**
   * Get all user settings
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with all user settings (privacy, notifications, security, etc.)
   */
  getUserSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const settings = await UserService.getUserSettings(userId);
    return formatResponse(res, 200, 1, 'Success', settings);
  }),

  /**
   * Update user privacy settings
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body with privacy settings
   * @param {string} [req.body.profileVisibility] - Profile visibility (public/private/followers)
   * @param {string} [req.body.allowMessages] - Who can send messages
   * @param {string} [req.body.messagePermission] - Alternative for allowMessages
   * @param {boolean} [req.body.showActivity] - Show activity status
   * @param {boolean} [req.body.activityStatus] - Alternative for showActivity
   * @param {string} [req.body.postVisibility] - Default post visibility
   * @param {boolean} [req.body.searchable] - Allow profile to be searchable
   * @param {boolean} [req.body.searchVisibility] - Alternative for searchable
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated privacy settings
   */
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
      'Cập nhật cài đặt quyền riêng tư thành công',
      updated
    );
  }),

  /**
   * Update user notification settings
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body with notification settings
   * @param {boolean} [req.body.likes] - Notify on likes
   * @param {boolean} [req.body.comments] - Notify on comments
   * @param {boolean} [req.body.follows] - Notify on new followers
   * @param {boolean} [req.body.newFollower] - Alternative for follows
   * @param {boolean} [req.body.mentions] - Notify on mentions
   * @param {boolean} [req.body.messages] - Notify on messages
   * @param {boolean} [req.body.directMessages] - Alternative for messages
   * @param {boolean} [req.body.shares] - Notify on shares
   * @param {boolean} [req.body.email] - Enable email notifications
   * @param {boolean} [req.body.push] - Enable push notifications
   * @param {boolean} [req.body.systemUpdates] - Notify on system updates
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated notification settings
   */
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
      'Cập nhật cài đặt thông báo thành công',
      updated
    );
  }),

  /**
   * Update user security settings
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body with security settings
   * @param {boolean} [req.body.twoFactorEnabled] - Enable/disable 2FA
   * @param {boolean} [req.body.loginAlerts] - Enable/disable login alerts
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated security settings
   */
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
      'Cập nhật cài đặt bảo mật thành công',
      updated
    );
  }),

  /**
   * Update user content settings
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body with content settings
   * @param {string} [req.body.language] - Preferred language
   * @param {boolean} [req.body.autoplay] - Enable video autoplay
   * @param {boolean} [req.body.autoplayEnabled] - Alternative for autoplay
   * @param {string} [req.body.quality] - Preferred video quality
   * @param {Array} [req.body.contentFilters] - Content filter preferences
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated content settings
   */
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
      'Cập nhật cài đặt nội dung thành công',
      updated
    );
  }),

  /**
   * Update user theme/appearance settings
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body with theme settings
   * @param {string} [req.body.theme] - Theme preference (light/dark/system)
   * @param {string} [req.body.appearance] - Alternative for theme
   * @param {string} [req.body.fontSize] - Font size preference
   * @param {string} [req.body.colorScheme] - Color scheme preference
   * @param {string} [req.body.primaryColor] - Alternative for colorScheme
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated appearance settings
   */
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
      'Cập nhật cài đặt giao diện thành công',
      updated
    );
  }),

  /**
   * Block a user
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.blockedUserId - ID of user to block
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with block success message
   */
  blockUser: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { blockedUserId } = req.body;

    if (!blockedUserId) {
      return formatResponse(res, 400, 0, 'Thiếu ID người dùng cần chặn');
    }

    await UserService.blockUser(userId, blockedUserId);
    return formatResponse(res, 200, 1, 'Chặn người dùng thành công');
  }),

  /**
   * Unblock a user
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.blockedUserId - ID of user to unblock
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with unblock success message
   */
  unblockUser: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { blockedUserId } = req.params;

    if (!blockedUserId) {
      return formatResponse(res, 400, 0, 'Thiếu ID người dùng cần bỏ chặn');
    }

    await UserService.unblockUser(userId, blockedUserId);
    return formatResponse(res, 200, 1, 'Bỏ chặn người dùng thành công');
  }),

  /**
   * Mute a user
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.targetUserId - ID of user to mute
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with mute success message
   */
  muteUser: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return formatResponse(res, 400, 0, 'Thiếu ID người dùng cần ẩn');
    }

    await UserService.muteUser(userId, targetUserId);
    return formatResponse(res, 200, 1, 'Đã ẩn người dùng thành công');
  }),

  /**
   * Unmute a user
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.targetUserId - ID of user to unmute
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with unmute success message
   */
  unmuteUser: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { targetUserId } = req.params;

    await UserService.unmuteUser(userId, targetUserId);
    return formatResponse(res, 200, 1, 'Đã bỏ ẩn người dùng thành công');
  }),

  /**
   * Get list of blocked users
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with list of blocked users
   */
  getBlockList: CatchError(async (req, res) => {
    const userId = req.user.id;
    const blockedUsers = await UserService.getBlockedUsers(userId);
    return formatResponse(res, 200, 1, 'Success', blockedUsers);
  }),

  /**
   * Get list of muted users
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with list of muted users
   */
  getMuteList: CatchError(async (req, res) => {
    const userId = req.user.id;
    const mutedUsers = await UserService.getMutedUsers(userId);
    return formatResponse(res, 200, 1, 'Success', mutedUsers);
  }),

  /**
   * Add trusted device (deprecated - moved to auth/sessions)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Response indicating feature has been moved
   * @deprecated Use auth/sessions endpoints instead
   */
  addTrustedDevice: CatchError(async (req, res) => {
    return formatResponse(res, 200, 1, 'Feature moved to auth/sessions');
  }),

  /**
   * Remove trusted device (deprecated - moved to auth/sessions)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Response indicating feature has been moved
   * @deprecated Use auth/sessions endpoints instead
   */
  removeTrustedDevice: CatchError(async (req, res) => {
    return formatResponse(res, 200, 1, 'Feature moved to auth/sessions');
  }),
};

export default UserController;
