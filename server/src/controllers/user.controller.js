import { CatchError } from "../configs/CatchError.js";
import UserService from "../services/User.Service.js";
import { formatResponse } from "../helpers/formatResponse.js";
const UserController = {
  GET_TOP_USERS_BY_LIKES: CatchError(async (req, res) => {
    const topUsers = await UserService.getTopUsersByLikes();
    return formatResponse(res, 200, 1, "Get top users successfully", topUsers);
  }),

  Get_User_By_Id: CatchError(async (req, res) => {
    const id = req.params.id;
    try {
      const enhancedUserData = await UserService.getUserById(id);
      return formatResponse(
        res,
        200,
        1,
        "Get user successfully!",
        enhancedUserData
      );
    } catch (error) {
      if (error.message === "User ID is required!") error.statusCode = 400;
      if (error.message === "User not found!") error.statusCode = 404;
      throw error;
    }
  }),

  getAllUsers: CatchError(async (req, res) => {
    const currentUserId = req.user.id;
    const usersWithLastMessage = await UserService.getAllUsers(currentUserId);
    return formatResponse(res, 200, 1, "Success", usersWithLastMessage);
  }),

  searchUsers: CatchError(async (req, res) => {
    const { query } = req.query;
    const currentUserId = req.user.id;

    if (!query) {
      const error = new Error("Search query is required");
      error.statusCode = 400;
      throw error;
    }

    const formattedUsers = await UserService.searchUsers(query, currentUserId);
    return formatResponse(res, 200, 1, "Success", formattedUsers);
  }),

  checkFollowStatus: CatchError(async (req, res) => {
    const { targetUserId } = req.params;
    const currentUserId = req.user.id;

    const isFollowing = await UserService.checkFollowStatus(
      currentUserId,
      targetUserId
    );

    return formatResponse(res, 200, 1, "Success", null, { isFollowing });
  }),

  followUser: CatchError(async (req, res) => {
    const { targetUserId } = req.body;
    const currentUserId = req.user.id;

    try {
      await UserService.followUser(currentUserId, targetUserId);
      return formatResponse(res, 200, 1, "Theo dõi thành công");
    } catch (error) {
      if (
        error.message === "Bạn không thể theo dõi chính mình" ||
        error.message === "Bạn đã theo dõi người dùng này rồi"
      ) {
        error.statusCode = 400;
      } else if (error.message === "Không tìm thấy người dùng" || error.message === "Không tìm thấy người dùng hiện tại") {
        error.statusCode = 404;
      }
      throw error;
    }
  }),

  unfollowUser: CatchError(async (req, res) => {
    const { targetUserId } = req.body;
    const currentUserId = req.user.id;

    try {
      await UserService.unfollowUser(currentUserId, targetUserId);
      return formatResponse(res, 200, 1, "Đã hủy theo dõi");
    } catch (error) {
      if (
        error.message === "Không thể thực hiện thao tác này" ||
        error.message === "Bạn chưa theo dõi người dùng này"
      ) {
        error.statusCode = 400;
      } else if (error.message === "Không tìm thấy người dùng" || error.message === "Không tìm thấy người dùng hiện tại") {
        error.statusCode = 404;
      }
      throw error;
    }
  }),

  // --- Methods from ProfileController ---
  GET_PROFILE_BY_ID: CatchError(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      const error = new Error("User ID is required!");
      error.statusCode = 400;
      throw error;
    }

    try {
      const profile = await UserService.getProfileById(id);
      return formatResponse(res, 200, 0, "Get profile successfully!", profile);
    } catch (error) {
      if (
        error.message === "Profile not found" ||
        error.message === "Profile ID is required"
      ) {
        error.statusCode = 404;
      }
      throw error;
    }
  }),

  // --- Methods from UserSettingsController ---
  getUserSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const userSettings = await UserService.getUserSettings(userId);
    return formatResponse(res, 200, 1, "Success", null, { userSettings });
  }),

  updateProfileSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    let updatedFields = {};
    let avatarUrl = null;

    if ((req.file && req.file.path) || (req.files && req.files.avatar)) {
      if (req.file && req.file.path) {
        avatarUrl = req.file.path;
      } else if (req.files && req.files.avatar) {
        const avatar = req.files.avatar;
        try {
          avatarUrl = await UserService.uploadAvatarToCloudinary(
            avatar,
            userId
          );
        } catch (error) {
          const uploadError = new Error(
            "Không thể upload ảnh đại diện lên cloud: " + error.message
          );
          uploadError.statusCode = 500;
          throw uploadError;
        }
      }

      if (req.body.avatarInfo) {
        updatedFields.avatarInfo = req.body.avatarInfo;
      }
    } else {
      const {
        name, bio, birthday, gender, website, interests, avatar, avatarInfo,
      } = req.body;

      if (name !== undefined) updatedFields.name = name;
      if (bio !== undefined) updatedFields.bio = bio;
      if (birthday !== undefined) updatedFields.birthday = birthday;
      if (gender !== undefined) updatedFields.gender = gender;
      if (website !== undefined) updatedFields.website = website;
      if (interests !== undefined) updatedFields.interests = interests;
      if (avatar !== undefined) updatedFields.avatar = avatar;
      if (avatarInfo !== undefined) updatedFields.avatarInfo = avatarInfo;
    }

    const { profile, userData } = await UserService.updateProfileSettings(
      userId,
      updatedFields,
      avatarUrl
    );

    return formatResponse(res, 200, 1, "Cập nhật thông tin hồ sơ thành công", null, {
      profile,
      userData,
    });
  }),

  updatePrivacySettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const privacySettings = {
      profileVisibility: req.body.profileVisibility,
      postVisibility: req.body.postVisibility,
      messagePermission: req.body.messagePermission,
      searchVisibility: req.body.searchVisibility,
      activityStatus: req.body.activityStatus,
    };

    const updatedPrivacySettings = await UserService.updatePrivacySettings(
      userId,
      privacySettings
    );

    return formatResponse(
        res, 200, 1, "Cập nhật cài đặt quyền riêng tư thành công", null, { privacySettings: updatedPrivacySettings }
    );
  }),

  updateNotificationSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const notificationSettings = {
      email: req.body.email,
      push: req.body.push,
      newFollower: req.body.newFollower,
      likes: req.body.likes,
      comments: req.body.comments,
      mentions: req.body.mentions,
      directMessages: req.body.directMessages,
      systemUpdates: req.body.systemUpdates,
    };

    const updatedNotificationSettings = await UserService.updateNotificationSettings(
      userId,
      notificationSettings
    );

    return formatResponse(
        res, 200, 1, "Cập nhật cài đặt thông báo thành công", null, { notificationSettings: updatedNotificationSettings }
    );
  }),

  updateSecuritySettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const securitySettings = {
      twoFactorEnabled: req.body.twoFactorEnabled,
      loginAlerts: req.body.loginAlerts,
      trustedDevices: req.body.trustedDevices,
      securityQuestions: req.body.securityQuestions,
    };

    const updatedSecuritySettings = await UserService.updateSecuritySettings(
      userId,
      securitySettings
    );

    return formatResponse(
        res, 200, 1, "Cập nhật cài đặt bảo mật thành công", null, { securitySettings: updatedSecuritySettings }
    );
  }),

  updateContentSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const contentSettings = {
      language: req.body.language,
      contentVisibility: req.body.contentVisibility,
      autoplayEnabled: req.body.autoplayEnabled,
      contentFilters: req.body.contentFilters,
    };

    const updatedContentSettings = await UserService.updateContentSettings(
      userId,
      contentSettings
    );

    return formatResponse(
        res, 200, 1, "Cập nhật cài đặt nội dung thành công", null, { contentSettings: updatedContentSettings }
    );
  }),

  updateThemeSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const themeSettings = {
      appearance: req.body.appearance,
      primaryColor: req.body.primaryColor,
      fontSize: req.body.fontSize,
    };

    const updatedThemeSettings = await UserService.updateThemeSettings(
      userId,
      themeSettings
    );

    return formatResponse(
        res, 200, 1, "Cập nhật cài đặt giao diện thành công", null, { themeSettings: updatedThemeSettings }
    );
  }),

  addTrustedDevice: CatchError(async (req, res) => {
    const userId = req.user.id;
    const deviceData = {
      deviceId: req.body.deviceId,
      deviceName: req.body.deviceName,
    };

    try {
      const trustedDevices = await UserService.addTrustedDevice(
        userId,
        deviceData
      );
      return formatResponse(res, 200, 1, "Thêm thiết bị được tin cậy thành công", null, { trustedDevices });
    } catch (error) {
      if (error.message === "Thiếu thông tin thiết bị") error.statusCode = 400;
      throw error;
    }
  }),

  removeTrustedDevice: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { deviceId } = req.params;

    try {
      const trustedDevices = await UserService.removeTrustedDevice(
        userId,
        deviceId
      );
      return formatResponse(res, 200, 1, "Xóa thiết bị được tin cậy thành công", null, { trustedDevices });
    } catch (error) {
      if (error.message === "Thiếu thông tin thiết bị") error.statusCode = 400;
      if (error.message === "Không tìm thấy cài đặt người dùng") error.statusCode = 404;
      throw error;
    }
  }),

  blockUser: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { blockedUserId } = req.body;

    if (!blockedUserId) {
      const error = new Error("Thiếu ID người dùng cần chặn");
      error.statusCode = 400;
      throw error;
    }

    try {
      const blockedUsers = await UserService.updateBlockedUsers(
        userId,
        "block",
        blockedUserId
      );
      return formatResponse(res, 200, 1, "Chặn người dùng thành công", null, { blockList: blockedUsers });
    } catch (error) {
      if (error.message === "User ID to block/unblock is required") {
        error.message = "Thiếu ID người dùng cần chặn";
        error.statusCode = 400;
      } else if (error.message === "User is already blocked") {
        error.message = "Người dùng này đã bị chặn";
        error.statusCode = 400;
      } else if (error.message === "Không tìm thấy người dùng cần chặn") {
        error.statusCode = 404;
      }
      throw error;
    }
  }),

  unblockUser: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { blockedUserId } = req.params;

    if (!blockedUserId) {
      const error = new Error("Thiếu ID người dùng cần bỏ chặn");
      error.statusCode = 400;
      throw error;
    }

    try {
      const blockedUsers = await UserService.updateBlockedUsers(
        userId,
        "unblock",
        blockedUserId
      );
      return formatResponse(res, 200, 1, "Bỏ chặn người dùng thành công", null, { blockList: blockedUsers });
    } catch (error) {
      if (error.message === "User ID to block/unblock is required") {
        error.message = "Thiếu ID người dùng cần bỏ chặn";
        error.statusCode = 400;
      } else if (error.message === "Không tìm thấy người dùng cần bỏ chặn") {
        error.statusCode = 404;
      }
      throw error;
    }
  }),

  getBlockList: CatchError(async (req, res) => {
    const userId = req.user.id;
    const blockedUsers = await UserService.getBlockedUsers(userId);
    return formatResponse(res, 200, 1, "Success", null, { blockList: blockedUsers });
  }),
};

export default UserController;
