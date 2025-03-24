import { CatchError } from "../../configs/CatchError.js";
import UserSettings from "../../models/mongodb/UserSettings.js";
import User from "../../models/mongodb/Users.js";
import Profile from "../../models/mongodb/Profiles.js";

const UserSettingsController = {
  // Lấy tất cả cài đặt của người dùng
  getUserSettings: CatchError(async (req, res) => {
    const userId = req.user.id;

    let userSettings = await UserSettings.findOne({ userId });

    // Nếu chưa có, tạo mới với cài đặt mặc định
    if (!userSettings) {
      userSettings = await UserSettings.create({ userId });
    }

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

    // Nếu có file avatar từ multer (req.file) hoặc express-fileupload (req.files)
    if ((req.file && req.file.path) || (req.files && req.files.avatar)) {
      let avatarUrl;

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

        // Log chi tiết về file
        console.log("File size:", avatar.size);
        console.log("File mime type:", avatar.mimetype);

        // Kiểm tra kích thước file (10MB)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (avatar.size > MAX_FILE_SIZE) {
          const sizeMB = (avatar.size / (1024 * 1024)).toFixed(2);
          const message = `Kích thước ảnh ${sizeMB}MB vượt quá giới hạn 10MB`;
          console.error(message);
          return res.status(400).json({
            success: false,
            message: message,
          });
        }

        // Upload file lên Cloudinary thay vì lưu cục bộ
        try {
          const cloudinary = (await import("../../configs/cloudinaryConfig.js"))
            .default;
          const result = await cloudinary.uploader.upload(avatar.tempFilePath, {
            folder: "avatars",
            public_id: `avatar_${userId}_${Date.now()}`,
            resource_type: "image",
          });
          avatarUrl = result.secure_url;
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

      // Lưu URL avatar vào updatedFields
      if (avatarUrl) {
        updatedFields.avatar = avatarUrl;
      }

      // Save avatar info if provided
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

    // Find or create Profile
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = new Profile({ userId });
    }

    // Update profile fields
    Object.keys(updatedFields).forEach((key) => {
      if (key !== "name" && key !== "avatar") {
        // These go to User model
        if (key === "birthday" && updatedFields[key]) {
          profile[key] = new Date(updatedFields[key]);
        } else {
          profile[key] = updatedFields[key];
        }
      }
    });

    await profile.save();

    // Update name and avatar in User model
    let userData = null;
    try {
      const userUpdateFields = {};
      if (updatedFields.name !== undefined)
        userUpdateFields.name = updatedFields.name;
      if (updatedFields.avatar !== undefined)
        userUpdateFields.avatar = updatedFields.avatar;

      if (Object.keys(userUpdateFields).length > 0) {
        userData = await User.findByIdAndUpdate(userId, userUpdateFields, {
          new: true,
        }).select("name username email avatar");

        console.log("Cập nhật user:", userData);
      } else {
        userData = await User.findById(userId).select(
          "name username email avatar"
        );
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin user:", error);
      throw error;
    }

    // Create full user data object to return
    const fullUserData = {
      ...userData._doc,
      bio: profile.bio,
      birthday: profile.birthday,
      gender: profile.gender,
      website: profile.website,
      interests: profile.interests,
    };

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin hồ sơ thành công",
      profile,
      userData: fullUserData,
    });
  }, "Failed to update profile settings"),

  // Cập nhật cài đặt quyền riêng tư
  updatePrivacySettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const {
      profileVisibility,
      postVisibility,
      messagePermission,
      searchVisibility,
      activityStatus,
    } = req.body;

    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    // Cập nhật các trường privacy
    if (profileVisibility !== undefined)
      userSettings.privacy.profileVisibility = profileVisibility;
    if (postVisibility !== undefined)
      userSettings.privacy.postVisibility = postVisibility;
    if (messagePermission !== undefined)
      userSettings.privacy.messagePermission = messagePermission;
    if (searchVisibility !== undefined)
      userSettings.privacy.searchVisibility = searchVisibility;
    if (activityStatus !== undefined)
      userSettings.privacy.activityStatus = activityStatus;

    await userSettings.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật cài đặt quyền riêng tư thành công",
      privacySettings: userSettings.privacy,
    });
  }, "Failed to update privacy settings"),

  // Cập nhật cài đặt thông báo
  updateNotificationSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const {
      email,
      push,
      newFollower,
      likes,
      comments,
      mentions,
      directMessages,
      systemUpdates,
    } = req.body;

    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    // Update email and push notification settings
    if (email !== undefined) {
      userSettings.notifications.emailNotifications.enabled = email;
    }

    if (push !== undefined) {
      userSettings.notifications.pushNotifications.enabled = push;
    }

    // Update specific notification types
    if (newFollower !== undefined) {
      userSettings.notifications.pushNotifications.follows = newFollower;
    }

    if (likes !== undefined) {
      userSettings.notifications.pushNotifications.likes = likes;
    }

    if (comments !== undefined) {
      userSettings.notifications.pushNotifications.comments = comments;
    }

    if (mentions !== undefined) {
      // Add mentions field if it doesn't exist yet
      if (
        !userSettings.notifications.pushNotifications.hasOwnProperty("mentions")
      ) {
        userSettings.notifications.pushNotifications.mentions = mentions;
      } else {
        userSettings.notifications.pushNotifications.mentions = mentions;
      }
    }

    if (directMessages !== undefined) {
      userSettings.notifications.pushNotifications.messages = directMessages;
    }

    if (systemUpdates !== undefined) {
      userSettings.notifications.emailNotifications.accountUpdates =
        systemUpdates;
    }

    await userSettings.save();

    // Format the response to match the client-side structure
    const formattedSettings = {
      email: userSettings.notifications.emailNotifications.enabled,
      push: userSettings.notifications.pushNotifications.enabled,
      newFollower: userSettings.notifications.pushNotifications.follows,
      likes: userSettings.notifications.pushNotifications.likes,
      comments: userSettings.notifications.pushNotifications.comments,
      mentions: userSettings.notifications.pushNotifications.mentions || false,
      directMessages: userSettings.notifications.pushNotifications.messages,
      systemUpdates:
        userSettings.notifications.emailNotifications.accountUpdates,
    };

    res.status(200).json({
      success: true,
      message: "Cập nhật cài đặt thông báo thành công",
      notificationSettings: formattedSettings,
    });
  }, "Failed to update notification settings"),

  // Cập nhật cài đặt bảo mật
  updateSecuritySettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { twoFactorEnabled, loginAlerts, trustedDevices, securityQuestions } =
      req.body;

    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    // Cập nhật các trường security
    if (twoFactorEnabled !== undefined)
      userSettings.security.twoFactorEnabled = twoFactorEnabled;
    if (loginAlerts !== undefined)
      userSettings.security.loginAlerts = loginAlerts;

    // Cập nhật trusted devices
    if (trustedDevices) {
      if (Array.isArray(trustedDevices)) {
        userSettings.security.trustedDevices = trustedDevices;
      }
    }

    // Cập nhật security questions
    if (securityQuestions) {
      if (Array.isArray(securityQuestions)) {
        userSettings.security.securityQuestions = securityQuestions;
      }
    }

    await userSettings.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật cài đặt bảo mật thành công",
      securitySettings: userSettings.security,
    });
  }, "Failed to update security settings"),

  // Cập nhật cài đặt nội dung
  updateContentSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { language, contentVisibility, autoplayEnabled, contentFilters } =
      req.body;

    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    // Cập nhật các trường content
    if (language !== undefined) userSettings.content.language = language;
    if (contentVisibility !== undefined)
      userSettings.content.contentVisibility = contentVisibility;
    if (autoplayEnabled !== undefined)
      userSettings.content.autoplayEnabled = autoplayEnabled;

    // Cập nhật content filters
    if (contentFilters) {
      if (contentFilters.adult !== undefined)
        userSettings.content.contentFilters.adult = contentFilters.adult;
      if (contentFilters.violence !== undefined)
        userSettings.content.contentFilters.violence = contentFilters.violence;
      if (contentFilters.hate !== undefined)
        userSettings.content.contentFilters.hate = contentFilters.hate;
    }

    await userSettings.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật cài đặt nội dung thành công",
      contentSettings: userSettings.content,
    });
  }, "Failed to update content settings"),

  // Cập nhật cài đặt giao diện
  updateThemeSettings: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { appearance, primaryColor, fontSize } = req.body;

    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    // Cập nhật các trường theme
    if (appearance !== undefined) userSettings.theme.appearance = appearance;
    if (primaryColor !== undefined)
      userSettings.theme.primaryColor = primaryColor;
    if (fontSize !== undefined) userSettings.theme.fontSize = fontSize;

    await userSettings.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật cài đặt giao diện thành công",
      themeSettings: userSettings.theme,
    });
  }, "Failed to update theme settings"),

  // API để thêm thiết bị được tin cậy
  addTrustedDevice: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { deviceId, deviceName } = req.body;

    if (!deviceId || !deviceName) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin thiết bị",
      });
    }

    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    // Kiểm tra xem thiết bị đã tồn tại chưa
    const deviceExists = userSettings.security.trustedDevices.some(
      (device) => device.deviceId === deviceId
    );

    if (deviceExists) {
      // Cập nhật ngày sử dụng gần nhất
      userSettings.security.trustedDevices =
        userSettings.security.trustedDevices.map((device) => {
          if (device.deviceId === deviceId) {
            return {
              ...device,
              deviceName,
              lastUsed: new Date(),
            };
          }
          return device;
        });
    } else {
      // Thêm thiết bị mới
      userSettings.security.trustedDevices.push({
        deviceId,
        deviceName,
        lastUsed: new Date(),
      });
    }

    await userSettings.save();

    res.status(200).json({
      success: true,
      message: "Thêm thiết bị được tin cậy thành công",
      trustedDevices: userSettings.security.trustedDevices,
    });
  }, "Failed to add trusted device"),

  // API để xóa thiết bị được tin cậy
  removeTrustedDevice: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin thiết bị",
      });
    }

    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cài đặt người dùng",
      });
    }

    // Xóa thiết bị
    userSettings.security.trustedDevices =
      userSettings.security.trustedDevices.filter(
        (device) => device.deviceId !== deviceId
      );

    await userSettings.save();

    res.status(200).json({
      success: true,
      message: "Xóa thiết bị được tin cậy thành công",
      trustedDevices: userSettings.security.trustedDevices,
    });
  }, "Failed to remove trusted device"),

  // API để chặn người dùng
  blockUser: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { blockedUserId } = req.body;

    console.log("Yêu cầu chặn user:", { userId, blockedUserId });

    if (!blockedUserId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ID người dùng cần chặn",
      });
    }

    try {
      // Tạo query để tìm kiếm user
      const query = {
        $or: [{ email: blockedUserId }, { username: blockedUserId }],
      };

      // Kiểm tra nếu blockedUserId có thể là một ObjectId hợp lệ
      const mongoose = (await import("mongoose")).default;
      if (mongoose.Types.ObjectId.isValid(blockedUserId)) {
        query.$or.push({ _id: blockedUserId });
      }

      console.log("Query tìm kiếm user:", JSON.stringify(query));

      // Kiểm tra người dùng tồn tại
      const blockedUser = await User.findOne(query);

      console.log("Kết quả tìm kiếm user:", blockedUser);

      if (!blockedUser) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng cần chặn",
        });
      }

      let userSettings = await UserSettings.findOne({ userId });

      if (!userSettings) {
        userSettings = new UserSettings({ userId });
      }

      const actualBlockedUserId = blockedUser._id.toString();

      // Kiểm tra xem đã chặn chưa
      const alreadyBlocked = userSettings.privacy.blockList.some(
        (id) => id.toString() === actualBlockedUserId
      );

      if (alreadyBlocked) {
        return res.status(400).json({
          success: false,
          message: "Người dùng này đã bị chặn",
        });
      }

      // Thêm vào danh sách chặn
      userSettings.privacy.blockList.push(actualBlockedUserId);
      await userSettings.save();

      res.status(200).json({
        success: true,
        message: "Chặn người dùng thành công",
        blockList: userSettings.privacy.blockList,
      });
    } catch (error) {
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

    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cài đặt người dùng",
      });
    }

    // Xóa khỏi danh sách chặn
    userSettings.privacy.blockList = userSettings.privacy.blockList.filter(
      (id) => id.toString() !== blockedUserId
    );

    await userSettings.save();

    res.status(200).json({
      success: true,
      message: "Bỏ chặn người dùng thành công",
      blockList: userSettings.privacy.blockList,
    });
  }, "Failed to unblock user"),

  // API để lấy danh sách chặn
  getBlockList: CatchError(async (req, res) => {
    const userId = req.user.id;

    let userSettings = await UserSettings.findOne({ userId }).populate({
      path: "privacy.blockList",
      select: "username name avatar",
    });

    if (!userSettings) {
      userSettings = new UserSettings({ userId });
      await userSettings.save();

      return res.status(200).json({
        success: true,
        blockList: [],
      });
    }

    res.status(200).json({
      success: true,
      blockList: userSettings.privacy.blockList,
    });
  }, "Failed to get block list"),
};

export default UserSettingsController;
