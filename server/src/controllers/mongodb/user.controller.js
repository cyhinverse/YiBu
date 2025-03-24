import mongoose from "mongoose";
import User from "../../models/mongodb/Users.js";
import Profiles from "../../models/mongodb/Profiles.js";
import Message from "../../models/mongodb/Messages.js";
import { CatchError } from "../../configs/CatchError.js";

const UserController = {
  GET_TOP_USERS_BY_LIKES: async (req, res) => {
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

      return res.status(200).json({
        code: 1,
        users: topUsers,
      });
    } catch (error) {
      return res.status(500).json({
        code: -1,
        message: "Server error",
        error: error.message,
      });
    }
  },

  Get_User_By_Id: async (req, res) => {
    try {
      const id = req.params.id;
      console.log(`Check id user by server :::`, id);

      if (!id) {
        return res.status(400).json({
          code: 0,
          message: "User ID is required!",
        });
      }

      let user = await User.findById(id)
        .populate("profile")
        .select("-password")
        .lean();

      console.log(`Check data:::`, user);

      if (!user) {
        return res.status(404).json({
          code: 0,
          message: "User not found!",
        });
      }

      if (!user.profile) {
        const newProfile = await Profiles.create({ userId: user._id });
        await User.findByIdAndUpdate(id, { profile: newProfile._id });
        user.profile = newProfile;
      }

      if (!user.following) {
        await User.findByIdAndUpdate(id, { following: [] });
        user.following = [];
      }
      if (!user.followers) {
        await User.findByIdAndUpdate(id, { followers: [] });
        user.followers = [];
      }

      const posts = await mongoose
        .model("Post")
        .find({ user: id })
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

      return res.json({
        code: 1,
        message: "Get user successfully!",
        data: enhancedUserData,
      });
    } catch (error) {
      console.error("Error in Get_User_By_Id:", error);
      return res.status(500).json({
        code: 0,
        message: error.message,
      });
    }
  },

  getAllUsers: CatchError(async (req, res) => {
    try {
      const currentUserId = req.user.id;
      console.log("Current user ID:", currentUserId);

      const users = await User.find({
        _id: { $ne: currentUserId },
      }).select("avatar email createdAt");

      console.log("Found users:", users);

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

      console.log("Users with messages:", usersWithLastMessage);

      res.status(200).json({
        success: true,
        data: usersWithLastMessage,
      });
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch users",
        error: error.message,
      });
    }
  }),

  searchUsers: CatchError(async (req, res) => {
    try {
      const { query } = req.query;
      const currentUserId = req.user.id;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
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

      res.status(200).json({
        success: true,
        data: formattedUsers,
      });
    } catch (error) {
      console.error("Error in searchUsers:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search users",
        error: error.message,
      });
    }
  }),

  checkFollowStatus: CatchError(async (req, res) => {
    try {
      const { targetUserId } = req.params;
      const currentUserId = req.user.id;

      const currentUser = await User.findById(currentUserId);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng hiện tại",
        });
      }

      if (!currentUser.following) {
        await User.findByIdAndUpdate(currentUserId, { following: [] });
        return res.status(200).json({
          success: true,
          isFollowing: false,
        });
      }

      const isFollowing = currentUser.following.includes(targetUserId);

      res.status(200).json({
        success: true,
        isFollowing,
      });
    } catch (error) {
      console.error("Error in checkFollowStatus:", error);
      res.status(500).json({
        success: false,
        message: "Không thể kiểm tra trạng thái theo dõi",
        error: error.message,
      });
    }
  }),

  followUser: CatchError(async (req, res) => {
    try {
      const { targetUserId } = req.body;
      const currentUserId = req.user.id;

      if (targetUserId === currentUserId) {
        return res.status(400).json({
          success: false,
          message: "Bạn không thể theo dõi chính mình",
        });
      }

      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      const currentUser = await User.findById(currentUserId);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng hiện tại",
        });
      }

      if (!currentUser.following) {
        currentUser.following = [];
      }
      if (!targetUser.followers) {
        targetUser.followers = [];
      }

      const isFollowing = currentUser.following.includes(targetUserId);
      if (isFollowing) {
        return res.status(400).json({
          success: false,
          message: "Bạn đã theo dõi người dùng này rồi",
        });
      }

      await User.findByIdAndUpdate(currentUserId, {
        $push: { following: targetUserId },
      });

      await User.findByIdAndUpdate(targetUserId, {
        $push: { followers: currentUserId },
      });

      res.status(200).json({
        success: true,
        message: "Theo dõi thành công",
      });
    } catch (error) {
      console.error("Error in followUser:", error);
      res.status(500).json({
        success: false,
        message: "Không thể theo dõi người dùng",
        error: error.message,
      });
    }
  }),

  unfollowUser: CatchError(async (req, res) => {
    try {
      const { targetUserId } = req.body;
      const currentUserId = req.user.id;

      if (targetUserId === currentUserId) {
        return res.status(400).json({
          success: false,
          message: "Không thể thực hiện thao tác này",
        });
      }

      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      const currentUser = await User.findById(currentUserId);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng hiện tại",
        });
      }

      if (!currentUser.following) {
        return res.status(400).json({
          success: false,
          message: "Bạn chưa theo dõi ai",
        });
      }
      if (!targetUser.followers) {
        targetUser.followers = [];
      }

      const isFollowing = currentUser.following.includes(targetUserId);
      if (!isFollowing) {
        return res.status(400).json({
          success: false,
          message: "Bạn chưa theo dõi người dùng này",
        });
      }

      await User.findByIdAndUpdate(currentUserId, {
        $pull: { following: targetUserId },
      });

      await User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: currentUserId },
      });

      res.status(200).json({
        success: true,
        message: "Đã hủy theo dõi",
      });
    } catch (error) {
      console.error("Error in unfollowUser:", error);
      res.status(500).json({
        success: false,
        message: "Không thể hủy theo dõi người dùng",
        error: error.message,
      });
    }
  }),
};

export default UserController;
