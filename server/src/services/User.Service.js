import mongoose from "mongoose";
import User from "../models/mongodb/Users.js";
import Profiles from "../models/mongodb/Profiles.js";
import Message from "../models/mongodb/Messages.js";

class UserService {
  static async findUserByEmail(email) {
    try {
      if (!email) {
        throw new Error("Email is required");
      }

      const user = await User.findOne({ email });

      if (!user) {
        console.error(`No user found with email: ${email}`);
        return null;
      }

      return user;
    } catch (error) {
      console.error("Database error in findUserByEmail:", error);
      throw error;
    }
  }

  static async getUserById(userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required!");
      }

      let user = await User.findById(userId)
        .populate("profile")
        .select("-password")
        .lean();

      if (!user) {
        throw new Error("User not found!");
      }

      if (!user.profile) {
        const newProfile = await Profiles.create({ userId: user._id });
        await User.findByIdAndUpdate(userId, { profile: newProfile._id });
        user.profile = newProfile;
      }

      if (!user.following) {
        await User.findByIdAndUpdate(userId, { following: [] });
        user.following = [];
      }
      if (!user.followers) {
        await User.findByIdAndUpdate(userId, { followers: [] });
        user.followers = [];
      }

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
      console.error("Error getting user by ID:", error);
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
      console.error("Error updating user:", error);
      throw error;
    }
  }

  static async deleteUser(userId) {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  static async getAllUsers(currentUserId) {
    try {
      const users = await User.find({
        _id: { $ne: currentUserId },
      }).select("avatar email createdAt");

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
            avatar: user.avatar || "https://via.placeholder.com/150",
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
      console.error("Error getting users:", error);
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
      }).select("avatar email createdAt");

      const formattedUsers = users.map((user) => ({
        _id: user._id,
        avatar: user.avatar || "https://via.placeholder.com/150",
        email: user.email,
        createdAt: user.createdAt,
      }));

      return formattedUsers;
    } catch (error) {
      console.error("Error searching users:", error);
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
      console.error("Error checking follow status:", error);
      throw error;
    }
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
      console.error("Error getting top users by likes:", error);
      throw error;
    }
  }

  static async getUserByUsername(username) {
    try {
      const user = await User.findOne({ username });
      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      throw error;
    }
  }

  static async createUser(userData) {
    try {
      const user = await User.create(userData);
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  static async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email });
      return user;
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  }
}

export default UserService;
