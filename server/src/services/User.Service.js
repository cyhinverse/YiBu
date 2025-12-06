import mongoose from "mongoose";
import User from "../models/User.js";
import Message from "../models/Message.js";
import logger from "../configs/logger.js";

class UserService {
  // ======================================
  // User Core Methods
  // ======================================
  static async findUserByEmail(email) {
    try {
      if (!email) {
        throw new Error("Email is required");
      }

      const user = await User.findOne({ email });

      if (!user) {
        logger.error(`No user found with email: ${email}`);
        return null;
      }

      return user;
    } catch (error) {
      logger.error("Database error in findUserByEmail:", error);
      throw error;
    }
  }

  static async getUserById(userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required!");
      }

      let user = await User.findById(userId)
        .select("-password")
        .lean();

      if (!user) {
        throw new Error("User not found!");
      }

      // Ensure embedded fields are present for response consistency
      if (!user.profile) user.profile = {};
      if (!user.settings) user.settings = {};
      if (!user.following) user.following = [];
      if (!user.followers) user.followers = [];

      const posts = await mongoose
        .model("Post")
        .find({ user: userId })
        .sort({ createdAt: -1 })
        .lean();

      const postIds = posts.map((post) => post._id);
      const likesCount = await mongoose.model("Like").countDocuments({
        post: { $in: postIds },
      });

      const enhancedUserData = {
        ...user,
        stats: {
          postsCount: posts.length,
          likesCount: likesCount,
          followersCount: user.followers.length,
          followingCount: user.following.length,
        },
        posts: posts.map((post) => ({
          _id: post._id,
          caption: post.caption,
          media: post.media,
          createdAt: post.createdAt,
        })),
      };

      return enhancedUserData;
    } catch (error) {
      logger.error("Error getting user by ID:", error);
      throw error;
    }
  }

  static async updateUser(userId, updateData) {
    try {
      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
      });
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    } catch (error) {
      logger.error("Error updating user:", error);
      throw error;
    }
  }

  static async deleteUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Find all posts by this user to clean up related data (comments on posts, etc.)
      const userPosts = await mongoose.model("Post").find({ user: userId }).select("_id");
      const userPostIds = userPosts.map(p => p._id);

      await Promise.all([
        // 1. Clean up data related to User's POSTS
        mongoose.model("Post").deleteMany({ user: userId }),
        mongoose.model("Comment").deleteMany({ post: { $in: userPostIds } }), // Comments on user's posts
        mongoose.model("Like").deleteMany({ post: { $in: userPostIds } }),    // Likes on user's posts
        mongoose.model("SavePost").deleteMany({ post: { $in: userPostIds } }), // Saves of user's posts
        mongoose.model("Notification").deleteMany({ post: { $in: userPostIds } }), // Notifications about user's posts

        // 2. Clean up User's OWN activity
        mongoose.model("Comment").deleteMany({ user: userId }), // User's comments elsewhere
        mongoose.model("Like").deleteMany({ user: userId }),    // User's likes elsewhere
        mongoose.model("SavePost").deleteMany({ user: userId }), // User's saved posts
        mongoose.model("Message").deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
        mongoose.model("Notification").deleteMany({ $or: [{ recipient: userId }, { sender: userId }] }),
        mongoose.model("Report").deleteMany({ reporter: userId }), // Delete reports made by user? Optional.

        // 3. Remove User from Following/Followers lists
        User.updateMany({ following: userId }, { $pull: { following: userId } }),
        User.updateMany({ followers: userId }, { $pull: { followers: userId } })
      ]);

      // Finally delete the user
      await User.findByIdAndDelete(userId);

      return user;
    } catch (error) {
      logger.error("Error deleting user:", error);
      throw error;
    }
  }

  static async getAllUsers(currentUserId) {
    try {
      const users = await User.find({
        _id: { $ne: currentUserId },
      }).select("profile.avatar email createdAt");

      const usersWithLastMessage = await Promise.all(
        users.map(async (user) => {
          const lastMessage = await Message.findOne({
            $or: [
              { sender: currentUserId, receiver: user._id },
              { sender: user._id, receiver: currentUserId },
            ],
          })
            .sort({ createdAt: -1 })
            .select("content createdAt isRead");

          const unreadCount = await Message.countDocuments({
            sender: user._id,
            receiver: currentUserId,
            isRead: false,
          });

          return {
            _id: user._id,
            avatar: user.profile?.avatar || "https://via.placeholder.com/150",
            email: user.email,
            lastMessage: lastMessage
              ? {
                  content: lastMessage.content,
                  time: lastMessage.createdAt,
                  isRead: lastMessage.isRead,
                }
              : null,
            unreadCount,
          };
        })
      );

      return usersWithLastMessage;
    } catch (error) {
      logger.error("Error getting users:", error);
      throw error;
    }
  }

  static async searchUsers(query, currentUserId) {
    try {
      if (!query) {
        throw new Error("Search query is required");
      }

      const users = await User.find({
        $and: [
          { _id: { $ne: currentUserId } },
          {
            $or: [{ email: { $regex: query, $options: "i" } }],
          },
        ],
      }).select("profile.avatar email createdAt");

      const formattedUsers = users.map((user) => ({
        _id: user._id,
        avatar: user.profile?.avatar || "https://via.placeholder.com/150",
        email: user.email,
        createdAt: user.createdAt,
      }));

      return formattedUsers;
    } catch (error) {
      logger.error("Error searching users:", error);
      throw error;
    }
  }

  static async checkFollowStatus(currentUserId, targetUserId) {
    try {
      const currentUser = await User.findById(currentUserId);
      if (!currentUser) {
        throw new Error("Không tìm thấy người dùng hiện tại");
      }

      if (!currentUser.following) {
        await User.findByIdAndUpdate(currentUserId, { following: [] });
        return false;
      }

      return currentUser.following.includes(targetUserId);
    } catch (error) {
      logger.error("Error checking follow status:", error);
      throw error;
    }
  }

  static async followUser(currentUserId, targetUserId) {
    if (targetUserId === currentUserId) {
      throw new Error("Bạn không thể theo dõi chính mình");
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new Error("Không tìm thấy người dùng");
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      throw new Error("Không tìm thấy người dùng hiện tại");
    }

    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];

    if (currentUser.following.includes(targetUserId)) {
      throw new Error("Bạn đã theo dõi người dùng này rồi");
    }

    await User.findByIdAndUpdate(currentUserId, {
      $push: { following: targetUserId },
    });

    await User.findByIdAndUpdate(targetUserId, {
      $push: { followers: currentUserId },
    });
    
    // Optional: Create notification manually here if not relying on another service
    
    return { success: true };
  }

  static async unfollowUser(currentUserId, targetUserId) {
    if (targetUserId === currentUserId) {
      throw new Error("Không thể thực hiện thao tác này");
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new Error("Không tìm thấy người dùng");
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      throw new Error("Không tìm thấy người dùng hiện tại");
    }

    if (!currentUser.following || !currentUser.following.includes(targetUserId)) {
      throw new Error("Bạn chưa theo dõi người dùng này");
    }

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: targetUserId },
    });

    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followers: currentUserId },
    });

    return { success: true };
  }

  static async getTopUsersByLikes() {
    try {
      const topUsers = await User.aggregate([
        {
          $lookup: {
            from: "posts",
            localField: "_id",
            foreignField: "userId",
            as: "posts",
          },
        },
        {
          $addFields: {
            totalLikes: { $sum: "$posts.likes" },
          },
        },
        { $sort: { totalLikes: -1 } },
        { $limit: 10 },
        {
          $project: {
            name: 1,
            email: 1,
            totalLikes: 1,
          },
        },
      ]);

      return topUsers;
    } catch (error) {
      logger.error("Error getting top users by likes:", error);
      throw error;
    }
  }

  static async getUserByUsername(username) {
    try {
      const user = await User.findOne({ username });
      return user;
    } catch (error) {
      logger.error("Error getting user by username:", error);
      throw error;
    }
  }

  static async createUser(userData) {
    try {
      const user = await User.create(userData);
      return user;
    } catch (error) {
      logger.error("Error creating user:", error);
      throw error;
    }
  }

  static async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email });
      return user;
    } catch (error) {
      logger.error("Error getting user by email:", error);
      throw error;
    }
  }

  // ======================================
  // Profile Methods (Consolidated)
  // ======================================
  static async findProfileByUserId(userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const user = await User.findById(userId).select("profile");

      if (!user) {
        logger.error(`No user found for user ID: ${userId}`);
        return null;
      }

      // Emulate standalone profile object structure just in case
      return { ...user.profile.toObject(), userId: user._id };
    } catch (error) {
      logger.error("Database error in findProfileByUserId:", error);
      throw new Error("Error finding profile");
    }
  }

  static async getProfileById(id) {
    // Assuming id is userId since profiles are embedded 1:1
    return this.findProfileByUserId(id);
  }

  static async createProfile(profileData) {
    // Usually handled at registration, but supportive of updates
    try {
        if (!profileData.userId) throw new Error("UserId required");
        return this.updateProfile(profileData.userId, profileData);
    } catch (error) {
      logger.error("Database error in createProfile:", error);
      throw new Error("Error creating profile");
    }
  }

  static async updateProfile(userId, updateData) {
    try {
      if (!userId || !updateData) {
        throw new Error("User ID and update data are required");
      }
      
      const updateQuery = {};
      Object.keys(updateData).forEach(key => {
          // Avoid overwriting entire profile object
          if (key !== 'userId') { 
            updateQuery[`profile.${key}`] = updateData[key];
          }
      });

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateQuery },
        { new: true }
      );

      if (!user) {
        logger.error(`No user found to update for ID: ${userId}`);
        return null;
      }

      return { ...user.profile.toObject(), userId: user._id };
    } catch (error) {
      logger.error("Database error in updateProfile:", error);
      throw new Error("Error updating profile");
    }
  }

  static async deleteProfile(userId) {
     return this.updateProfile(userId, { 
         bio: "", website: "", interests: "", 
         avatar: "https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1" 
     });
  }

  // ======================================
  // User Settings Methods (Consolidated)
  // ======================================
  static async getUserSettings(userId) {
    const user = await User.findById(userId).select("settings");
    if (!user) throw new Error("User not found");
    
    // Ensure settings object exists
    if (!user.settings) {
         // This might trigger a save if we were using a document instance, 
         // but here we might need an explicit update or just return default structure.
         return {}; 
    }
    return user.settings;
  }

  static async updateProfileSettings(userId, updatedFields, avatarUrl = null) {
    const updateSets = {};

    if (avatarUrl) {
      updateSets["profile.avatar"] = avatarUrl;
    }

    Object.keys(updatedFields).forEach((key) => {
      if (key === "name" || key === "username" || key === "email") {
         updateSets[key] = updatedFields[key];
      } else if (key === "avatar") {
         updateSets["profile.avatar"] = updatedFields[key];
      } else {
         // Profile fields
         if (key === "birthday" && updatedFields[key]) {
           updateSets[`profile.${key}`] = new Date(updatedFields[key]);
         } else {
           updateSets[`profile.${key}`] = updatedFields[key];
         }
      }
    });

    const user = await User.findByIdAndUpdate(userId, { $set: updateSets }, { new: true });
    if (!user) throw new Error("User not found");

    const userData = user.toObject();
    return {
      profile: userData.profile,
      userData: userData,
    };
  }

  static async uploadAvatarToCloudinary(avatar, userId) {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (avatar.size > MAX_FILE_SIZE) {
      const sizeMB = (avatar.size / (1024 * 1024)).toFixed(2);
      throw new Error(`Kích thước ảnh ${sizeMB}MB vượt quá giới hạn 10MB`);
    }

    const cloudinary = (await import("../configs/cloudinaryConfig.js")).default;
    const result = await cloudinary.uploader.upload(avatar.tempFilePath, {
      folder: "avatars",
      public_id: `avatar_${userId}_${Date.now()}`,
      resource_type: "image",
    });

    return result.secure_url;
  }

  static async updatePrivacySettings(userId, privacySettings) {
    // Map flattened settings to nested structure
    const updateSets = {};
    const {
      profileVisibility,
      postVisibility,
      messagePermission,
      searchVisibility,
      activityStatus,
      blockList
    } = privacySettings;

    if (profileVisibility !== undefined) updateSets["settings.privacy.profileVisibility"] = profileVisibility;
    if (postVisibility !== undefined) updateSets["settings.privacy.postVisibility"] = postVisibility;
    if (messagePermission !== undefined) updateSets["settings.privacy.messagePermission"] = messagePermission;
    if (searchVisibility !== undefined) updateSets["settings.privacy.searchVisibility"] = searchVisibility;
    if (activityStatus !== undefined) updateSets["settings.privacy.activityStatus"] = activityStatus;
    // Blocklist logic usually separate, but if present:
    if (blockList !== undefined) updateSets["settings.privacy.blockList"] = blockList;

    const user = await User.findByIdAndUpdate(userId, { $set: updateSets }, { new: true });
    return user.settings.privacy;
  }

  static async updateNotificationSettings(userId, notificationSettings) {
    const updateSets = {};
    const { email, push, likes, comments, newFollower, directMessages } = notificationSettings;

    if (email !== undefined) updateSets["settings.notifications.emailNotifications.enabled"] = email;
    if (push !== undefined) updateSets["settings.notifications.pushNotifications.enabled"] = push;
    
    // Mapping flat keys to schema keys
    if (likes !== undefined) updateSets["settings.notifications.pushNotifications.likes"] = likes;
    if (comments !== undefined) updateSets["settings.notifications.pushNotifications.comments"] = comments;
    if (newFollower !== undefined) updateSets["settings.notifications.pushNotifications.follows"] = newFollower;
    if (directMessages !== undefined) updateSets["settings.notifications.pushNotifications.messages"] = directMessages;

    const user = await User.findByIdAndUpdate(userId, { $set: updateSets }, { new: true });
    return user.settings.notifications;
  }

  static async updateTwoFactorAuth(userId, twoFactorSettings) {
    const { enabled } = twoFactorSettings;
    if (enabled === undefined) return; // Nothing to update
    
    const user = await User.findByIdAndUpdate(
        userId, 
        { $set: { "settings.security.twoFactorEnabled": enabled } },
        { new: true }
    );
    return user.settings.security;
  }

  static async updatePreferences(userId, preferences) {
    const { language, theme, fontSize, autoplayVideos, soundEffects } = preferences;
    const updateSets = {};
    
    if (language !== undefined) updateSets["settings.content.language"] = language;
    if (theme !== undefined) updateSets["settings.theme.appearance"] = theme;
    if (fontSize !== undefined) updateSets["settings.theme.fontSize"] = fontSize;
    if (autoplayVideos !== undefined) updateSets["settings.content.autoplayEnabled"] = autoplayVideos;
    // soundEffects not in my schema overview but safe to ignore if missing

    const user = await User.findByIdAndUpdate(userId, { $set: updateSets }, { new: true });
    return { ...user.settings.content, ...user.settings.theme };
  }

  static async updateBlockedUsers(userId, action, blockedUserId) {
    if (!blockedUserId) throw new Error("User ID required");
    
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (!user.settings.privacy.blockList) user.settings.privacy.blockList = [];
    
    const mongoose = (await import("mongoose")).default;
    let targetId = blockedUserId;

    if (action === "block") {
         // Resolve user
         const query = { $or: [] };
         if (mongoose.Types.ObjectId.isValid(blockedUserId)) query.$or.push({ _id: blockedUserId });
         query.$or.push({ email: blockedUserId });
         query.$or.push({ username: blockedUserId });
         
         const target = await User.findOne(query).select("_id");
         if (!target) throw new Error("Target user not found");
         targetId = target._id.toString();

         if (!user.settings.privacy.blockList.includes(targetId)) {
             user.settings.privacy.blockList.push(targetId);
         } else {
             throw new Error("Already blocked");
         }
    } else if (action === "unblock") {
        // Resolve ID if needed...
        if (!mongoose.Types.ObjectId.isValid(blockedUserId)) {
             const target = await User.findOne({ username: blockedUserId }).select("_id");
             if (target) targetId = target._id.toString();
        }
        
        user.settings.privacy.blockList = user.settings.privacy.blockList.filter(id => id.toString() !== targetId);
    }
    
    await user.save();
    
    // Populate
    await user.populate("settings.privacy.blockList", "name username email profile.avatar");
    
    return user.settings.privacy.blockList.map(u => ({
        _id: u._id,
        name: u.name,
        username: u.username,
        email: u.email,
        avatar: u.profile?.avatar
    }));
  }

  static async getBlockedUsers(userId) {
    const user = await User.findById(userId).populate("settings.privacy.blockList", "name username profile.avatar");
    return user?.settings?.privacy?.blockList || [];
  }

  static async updateSecuritySettings(userId, securitySettings) {
    const updateSets = {};
    if (securitySettings.loginAlerts !== undefined) 
        updateSets["settings.security.loginAlerts"] = securitySettings.loginAlerts;
    if (securitySettings.twoFactorEnabled !== undefined) 
        updateSets["settings.security.twoFactorEnabled"] = securitySettings.twoFactorEnabled;
        
    const user = await User.findByIdAndUpdate(userId, { $set: updateSets }, { new: true });
    return user.settings.security;
  }

  // Content/Theme settings aliases mapping to Preferences logic if needed, 
  // but existing UpdateContentSettings exists.
  static async updateContentSettings(userId, contentSettings) {
      // Reusing logic similar to preferences
      return this.updatePreferences(userId, contentSettings);
  }
  
  static async updateThemeSettings(userId, themeSettings) {
      return this.updatePreferences(userId, themeSettings);
  }
}

export default UserService;
