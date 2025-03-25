import { CatchError } from "../../configs/CatchError.js";
import UserSettingsService from "../../services/UserSettings.service.js";
import User from "../../models/mongodb/Users.js";
import Profile from "../../models/mongodb/Profiles.js";

const UserSettingsController = {
  // Lấy tất cả cài đặt của người dùng
  getUserSettings: CatchError(async (req, res) => {
    const userId = req.user.id;

    const userSettings = await UserSettingsService.getUserSettings(userId);

    res.status(200).json({
      success: true,
      userSettings,
    });
  }, "Failed to get user settings"),

  // Cập nhật thông tin Profile
  updateProfileSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    let updatedFields = {};
    let avatarUrl = null;

    // Nếu có file avatar từ multer (req.file) hoặc express-fileupload (req.files)
    if ((req.file && req.file.path) || (req.files && req.files.avatar)) {
      // Xử lý trường hợp sử dụng multer với cloudinary
      if (req.file && req.file.path) {
        console.log("Đã nhận file từ multer:", req.file);
        // Multer với Cloudinary đã tự động upload và trả về URL trong req.file.path
        avatarUrl = req.file.path;
      }
      // Xử lý trường hợp sử dụng express-fileupload
      else if (req.files && req.files.avatar) {
        const avatar = req.files.avatar;
        console.log("Đã nhận file từ express-fileupload:", avatar.name);
        console.log("File size:", avatar.size);
        console.log("File mime type:", avatar.mimetype);

        try {
          avatarUrl = await UserSettingsService.uploadAvatarToCloudinary(
            avatar,
            userId
          );
          console.log("Avatar uploaded to Cloudinary:", avatarUrl);
        } catch (error) {
          console.error("Error uploading to Cloudinary:", error);
          return res.status(500).json({
            success: false,
            message:
              "Không thể upload ảnh đại diện lên cloud: " + error.message,
          });
        }
      }

      // Lưu thông tin avatar vào updatedFields
      if (req.body.avatarInfo) {
        updatedFields.avatarInfo = req.body.avatarInfo;
        console.log("Thông tin ảnh đại diện:", req.body.avatarInfo);
      }
    } else {
      // Regular JSON request with profile data
      const {
        name,
        bio,
        birthday,
        gender,
        website,
        interests,
        avatar,
        avatarInfo,
      } = req.body;

      // Add fields to the update object if they exist
      if (name !== undefined) updatedFields.name = name;
      if (bio !== undefined) updatedFields.bio = bio;
      if (birthday !== undefined) updatedFields.birthday = birthday;
      if (gender !== undefined) updatedFields.gender = gender;
      if (website !== undefined) updatedFields.website = website;
      if (interests !== undefined) updatedFields.interests = interests;
      if (avatar !== undefined) updatedFields.avatar = avatar;
      if (avatarInfo !== undefined) updatedFields.avatarInfo = avatarInfo;
    }

    console.log("Fields to update:", updatedFields);

    const { profile, userData } =
      await UserSettingsService.updateProfileSettings(
        userId,
        updatedFields,
        avatarUrl
      );

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin hồ sơ thành công",
      profile,
      userData,
    });
  }, "Failed to update profile settings"),

  // Cập nhật cài đặt quyền riêng tư
  updatePrivacySettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const privacySettings = {
      profileVisibility: req.body.profileVisibility,
      postVisibility: req.body.postVisibility,
      messagePermission: req.body.messagePermission,
      searchVisibility: req.body.searchVisibility,
      activityStatus: req.body.activityStatus,
    };

    const updatedPrivacySettings =
      await UserSettingsService.updatePrivacySettings(userId, privacySettings);

    res.status(200).json({
      success: true,
      message: "Cập nhật cài đặt quyền riêng tư thành công",
      privacySettings: updatedPrivacySettings,
    });
  }, "Failed to update privacy settings"),

  // Cập nhật cài đặt thông báo
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

    const updatedNotificationSettings =
      await UserSettingsService.updateNotificationSettings(
        userId,
        notificationSettings
      );

    res.status(200).json({
      success: true,
      message: "Cập nhật cài đặt thông báo thành công",
      notificationSettings: updatedNotificationSettings,
    });
  }, "Failed to update notification settings"),

  // Cập nhật cài đặt bảo mật
  updateSecuritySettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const securitySettings = {
      twoFactorEnabled: req.body.twoFactorEnabled,
      loginAlerts: req.body.loginAlerts,
      trustedDevices: req.body.trustedDevices,
      securityQuestions: req.body.securityQuestions,
    };

    try {
      const updatedSecuritySettings =
        await UserSettingsService.updateSecuritySettings(
          userId,
          securitySettings
        );

      res.status(200).json({
        success: true,
        message: "Cập nhật cài đặt bảo mật thành công",
        securitySettings: updatedSecuritySettings,
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật cài đặt bảo mật:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật cài đặt bảo mật: " + error.message,
      });
    }
  }, "Failed to update security settings"),

  // Cập nhật cài đặt nội dung
  updateContentSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const contentSettings = {
      language: req.body.language,
      contentVisibility: req.body.contentVisibility,
      autoplayEnabled: req.body.autoplayEnabled,
      contentFilters: req.body.contentFilters,
    };

    try {
      const updatedContentSettings =
        await UserSettingsService.updateContentSettings(
          userId,
          contentSettings
        );

      res.status(200).json({
        success: true,
        message: "Cập nhật cài đặt nội dung thành công",
        contentSettings: updatedContentSettings,
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật cài đặt nội dung:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật cài đặt nội dung: " + error.message,
      });
    }
  }, "Failed to update content settings"),

  // Cập nhật cài đặt giao diện
  updateThemeSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const themeSettings = {
      appearance: req.body.appearance,
      primaryColor: req.body.primaryColor,
      fontSize: req.body.fontSize,
    };

    try {
      const updatedThemeSettings =
        await UserSettingsService.updateThemeSettings(userId, themeSettings);

      res.status(200).json({
        success: true,
        message: "Cập nhật cài đặt giao diện thành công",
        themeSettings: updatedThemeSettings,
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật cài đặt giao diện:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật cài đặt giao diện: " + error.message,
      });
    }
  }, "Failed to update theme settings"),

  // API để thêm thiết bị được tin cậy
  addTrustedDevice: CatchError(async (req, res) => {
    const userId = req.user.id;
    const deviceData = {
      deviceId: req.body.deviceId,
      deviceName: req.body.deviceName,
    };

    try {
      const trustedDevices = await UserSettingsService.addTrustedDevice(
        userId,
        deviceData
      );

      res.status(200).json({
        success: true,
        message: "Thêm thiết bị được tin cậy thành công",
        trustedDevices: trustedDevices,
      });
    } catch (error) {
      if (error.message === "Thiếu thông tin thiết bị") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi thêm thiết bị tin cậy:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi thêm thiết bị tin cậy: " + error.message,
      });
    }
  }, "Failed to add trusted device"),

  // API để xóa thiết bị được tin cậy
  removeTrustedDevice: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { deviceId } = req.params;

    try {
      const trustedDevices = await UserSettingsService.removeTrustedDevice(
        userId,
        deviceId
      );

      res.status(200).json({
        success: true,
        message: "Xóa thiết bị được tin cậy thành công",
        trustedDevices: trustedDevices,
      });
    } catch (error) {
      if (error.message === "Thiếu thông tin thiết bị") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      } else if (error.message === "Không tìm thấy cài đặt người dùng") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi xóa thiết bị tin cậy:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa thiết bị tin cậy: " + error.message,
      });
    }
  }, "Failed to remove trusted device"),

  // API để chặn người dùng
  blockUser: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { blockedUserId } = req.body;

    if (!blockedUserId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ID người dùng cần chặn",
      });
    }

    try {
      const blockedUsers = await UserSettingsService.updateBlockedUsers(
        userId,
        "block",
        blockedUserId
      );

      res.status(200).json({
        success: true,
        message: "Chặn người dùng thành công",
        blockList: blockedUsers,
      });
    } catch (error) {
      if (error.message === "User ID to block/unblock is required") {
        return res.status(400).json({
          success: false,
          message: "Thiếu ID người dùng cần chặn",
        });
      } else if (error.message === "User is already blocked") {
        return res.status(400).json({
          success: false,
          message: "Người dùng này đã bị chặn",
        });
      } else if (error.message === "Không tìm thấy người dùng cần chặn") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng cần chặn",
        });
      }

      console.error("Lỗi khi chặn người dùng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi chặn người dùng: " + error.message,
      });
    }
  }, "Failed to block user"),

  // API để bỏ chặn người dùng
  unblockUser: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { blockedUserId } = req.params;

    if (!blockedUserId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ID người dùng cần bỏ chặn",
      });
    }

    try {
      const blockedUsers = await UserSettingsService.updateBlockedUsers(
        userId,
        "unblock",
        blockedUserId
      );

      res.status(200).json({
        success: true,
        message: "Bỏ chặn người dùng thành công",
        blockList: blockedUsers,
      });
    } catch (error) {
      if (error.message === "User ID to block/unblock is required") {
        return res.status(400).json({
          success: false,
          message: "Thiếu ID người dùng cần bỏ chặn",
        });
      } else if (error.message === "Không tìm thấy người dùng cần bỏ chặn") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng cần bỏ chặn",
        });
      }

      console.error("Lỗi khi bỏ chặn người dùng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi bỏ chặn người dùng: " + error.message,
      });
    }
  }, "Failed to unblock user"),

  // API để lấy danh sách chặn
  getBlockList: CatchError(async (req, res) => {
    const userId = req.user.id;

    try {
      const blockedUsers = await UserSettingsService.getBlockedUsers(userId);

      res.status(200).json({
        success: true,
        blockList: blockedUsers,
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách chặn:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách chặn: " + error.message,
      });
    }
  }, "Failed to get block list"),
};

export default UserSettingsController;
