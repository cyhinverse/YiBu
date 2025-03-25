import UserSettings from "../models/mongodb/UserSettings.js";
import User from "../models/mongodb/Users.js";
import Profile from "../models/mongodb/Profiles.js";

class UserSettingsService {
  async getUserSettings(userId) {
    let userSettings = await UserSettings.findOne({ userId });

    // Nếu chưa có, tạo mới với cài đặt mặc định
    if (!userSettings) {
      userSettings = await UserSettings.create({ userId });
    }

    return userSettings;
  }

  async updateProfileSettings(userId, updatedFields, avatarUrl = null) {
    if (avatarUrl) {
      updatedFields.avatar = avatarUrl;
    }

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
    const userUpdateFields = {};
    if (updatedFields.name !== undefined)
      userUpdateFields.name = updatedFields.name;
    if (updatedFields.avatar !== undefined)
      userUpdateFields.avatar = updatedFields.avatar;

    let userData;
    if (Object.keys(userUpdateFields).length > 0) {
      userData = await User.findByIdAndUpdate(userId, userUpdateFields, {
        new: true,
      }).select("name username email avatar");
    } else {
      userData = await User.findById(userId).select(
        "name username email avatar"
      );
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

    return {
      profile,
      userData: fullUserData,
    };
  }

  async uploadAvatarToCloudinary(avatar, userId) {
    // Kiểm tra kích thước file (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (avatar.size > MAX_FILE_SIZE) {
      const sizeMB = (avatar.size / (1024 * 1024)).toFixed(2);
      throw new Error(`Kích thước ảnh ${sizeMB}MB vượt quá giới hạn 10MB`);
    }

    // Upload file lên Cloudinary
    const cloudinary = (await import("../configs/cloudinaryConfig.js")).default;
    const result = await cloudinary.uploader.upload(avatar.tempFilePath, {
      folder: "avatars",
      public_id: `avatar_${userId}_${Date.now()}`,
      resource_type: "image",
    });

    return result.secure_url;
  }

  async updatePrivacySettings(userId, privacySettings) {
    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    // Cập nhật các trường privacy
    const {
      profileVisibility,
      postVisibility,
      messagePermission,
      searchVisibility,
      activityStatus,
    } = privacySettings;

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

    return userSettings.privacy;
  }

  async updateNotificationSettings(userId, notificationSettings) {
    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    const {
      email,
      push,
      newFollower,
      likes,
      comments,
      mentions,
      directMessages,
      systemUpdates,
    } = notificationSettings;

    // Update email and push notification settings
    if (email !== undefined) {
      userSettings.notifications.emailNotifications.enabled = email;
    }

    if (push !== undefined) {
      userSettings.notifications.pushNotifications.enabled = push;
    }

    // Update specific notification types
    if (newFollower !== undefined)
      userSettings.notifications.types.newFollower = newFollower;
    if (likes !== undefined) userSettings.notifications.types.likes = likes;
    if (comments !== undefined)
      userSettings.notifications.types.comments = comments;
    if (mentions !== undefined)
      userSettings.notifications.types.mentions = mentions;
    if (directMessages !== undefined)
      userSettings.notifications.types.directMessages = directMessages;
    if (systemUpdates !== undefined)
      userSettings.notifications.types.systemUpdates = systemUpdates;

    await userSettings.save();

    return userSettings.notifications;
  }

  async updateTwoFactorAuth(userId, twoFactorSettings) {
    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    const { enabled, method, phone } = twoFactorSettings;

    if (enabled !== undefined)
      userSettings.security.twoFactorAuth.enabled = enabled;
    if (method !== undefined)
      userSettings.security.twoFactorAuth.method = method;
    if (phone !== undefined) userSettings.security.twoFactorAuth.phone = phone;

    await userSettings.save();

    return userSettings.security.twoFactorAuth;
  }

  async updatePreferences(userId, preferences) {
    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    const { language, theme, fontSize, autoplayVideos, soundEffects } =
      preferences;

    if (language !== undefined) userSettings.preferences.language = language;
    if (theme !== undefined) userSettings.preferences.theme = theme;
    if (fontSize !== undefined) userSettings.preferences.fontSize = fontSize;
    if (autoplayVideos !== undefined)
      userSettings.preferences.autoplayVideos = autoplayVideos;
    if (soundEffects !== undefined)
      userSettings.preferences.soundEffects = soundEffects;

    await userSettings.save();

    return userSettings.preferences;
  }

  async updateBlockedUsers(userId, action, blockedUserId) {
    if (!blockedUserId) {
      throw new Error("User ID to block/unblock is required");
    }

    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    const blockedUsers = userSettings.privacy.blockList || [];

    if (action === "block") {
      let blockedUser;
      const mongoose = (await import("mongoose")).default;

      // Tạo query để tìm kiếm user
      const query = { $or: [] };

      // Thêm tìm kiếm theo email
      query.$or.push({ email: blockedUserId });

      // Thêm tìm kiếm theo username (không phân biệt chữ hoa/thường)
      query.$or.push({ username: blockedUserId });
      query.$or.push({ username: blockedUserId.toLowerCase() });
      query.$or.push({ username: blockedUserId.toUpperCase() });

      // Thêm tìm kiếm theo tên người dùng (name)
      // Tìm kiếm theo tên đầy đủ hoặc một phần của tên
      query.$or.push({ name: blockedUserId });
      query.$or.push({ name: new RegExp(blockedUserId, "i") });

      // Kiểm tra nếu blockedUserId có thể là một ObjectId hợp lệ
      if (mongoose.Types.ObjectId.isValid(blockedUserId)) {
        query.$or.push({ _id: blockedUserId });
      }

      // Tìm kiếm người dùng với tất cả thông tin cần thiết
      blockedUser = await User.findOne(query).select(
        "_id name username email avatar"
      );

      if (!blockedUser) {
        throw new Error("Không tìm thấy người dùng cần chặn");
      }

      const actualBlockedUserId = blockedUser._id.toString();

      // Check if the blockedUserId is already in the list
      const isAlreadyBlocked = blockedUsers.some(
        (id) => id.toString() === actualBlockedUserId
      );

      if (isAlreadyBlocked) {
        throw new Error("User is already blocked");
      }

      // Add to blockList
      userSettings.privacy.blockList.push(actualBlockedUserId);
    } else if (action === "unblock") {
      // Đối với unblock, ta cần ObjectId hợp lệ
      const mongoose = (await import("mongoose")).default;

      // Nếu là username hoặc email, tìm ID trước
      if (!mongoose.Types.ObjectId.isValid(blockedUserId)) {
        const query = { $or: [] };

        // Thêm tìm kiếm theo email
        query.$or.push({ email: blockedUserId });

        // Thêm tìm kiếm theo username (không phân biệt chữ hoa/thường)
        query.$or.push({ username: blockedUserId });
        query.$or.push({ username: blockedUserId.toLowerCase() });
        query.$or.push({ username: blockedUserId.toUpperCase() });

        // Thêm tìm kiếm theo tên người dùng (name)
        query.$or.push({ name: blockedUserId });
        query.$or.push({ name: new RegExp(blockedUserId, "i") });

        const user = await User.findOne(query).select(
          "_id name username email avatar"
        );
        if (!user) {
          throw new Error("Không tìm thấy người dùng cần bỏ chặn");
        }

        blockedUserId = user._id.toString();
      }

      // Remove from blockList
      userSettings.privacy.blockList = blockedUsers.filter(
        (id) => id.toString() !== blockedUserId
      );
    }

    await userSettings.save();

    // Populate blocked users info với đầy đủ thông tin
    await userSettings.populate({
      path: "privacy.blockList",
      select: "name username email avatar",
    });

    // Đảm bảo dữ liệu không bị undefined
    const populatedBlockList = userSettings.privacy.blockList.map((user) => {
      return {
        _id: user._id,
        name: user.name || "Người dùng",
        username: user.username || "user",
        email: user.email || "",
        avatar: user.avatar || "https://via.placeholder.com/150",
      };
    });

    // Trả về danh sách đã được xử lý
    return populatedBlockList;
  }

  async getBlockedUsers(userId) {
    const userSettings = await UserSettings.findOne({ userId }).populate({
      path: "privacy.blockList",
      select: "name username avatar",
    });

    if (!userSettings) {
      // Create new settings with empty blockList
      const newSettings = new UserSettings({ userId });
      await newSettings.save();
      return [];
    }

    return userSettings.privacy.blockList || [];
  }

  async updateSecuritySettings(userId, securitySettings) {
    const { twoFactorEnabled, loginAlerts, trustedDevices, securityQuestions } =
      securitySettings;

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
    if (trustedDevices && Array.isArray(trustedDevices)) {
      userSettings.security.trustedDevices = trustedDevices;
    }

    // Cập nhật security questions
    if (securityQuestions && Array.isArray(securityQuestions)) {
      userSettings.security.securityQuestions = securityQuestions;
    }

    await userSettings.save();

    return userSettings.security;
  }

  async updateContentSettings(userId, contentSettings) {
    const { language, contentVisibility, autoplayEnabled, contentFilters } =
      contentSettings;

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

    return userSettings.content;
  }

  async updateThemeSettings(userId, themeSettings) {
    const { appearance, primaryColor, fontSize } = themeSettings;

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

    return userSettings.theme;
  }

  async addTrustedDevice(userId, deviceData) {
    const { deviceId, deviceName } = deviceData;

    if (!deviceId || !deviceName) {
      throw new Error("Thiếu thông tin thiết bị");
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

    return userSettings.security.trustedDevices;
  }

  async removeTrustedDevice(userId, deviceId) {
    if (!deviceId) {
      throw new Error("Thiếu thông tin thiết bị");
    }

    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      throw new Error("Không tìm thấy cài đặt người dùng");
    }

    // Xóa thiết bị
    userSettings.security.trustedDevices =
      userSettings.security.trustedDevices.filter(
        (device) => device.deviceId !== deviceId
      );

    await userSettings.save();

    return userSettings.security.trustedDevices;
  }
}

export default new UserSettingsService();
