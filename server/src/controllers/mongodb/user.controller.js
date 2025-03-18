import mongoose from "mongoose";
import User from "../../models/mongodb/Users.js";
import Profiles from "../../models/mongodb/Profiles.js";
import { Message } from "../../models/mongodb/Messages.js";
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

      // Nếu user chưa có profile, tạo profile mặc định
      if (!user.profile) {
        const newProfile = await Profiles.create({ userId: user._id });

        await User.findByIdAndUpdate(id, { profile: newProfile._id });

        // Gán profile vào user để trả về dữ liệu đầy đủ
        user.profile = newProfile;
      }

      return res.json({
        code: 1,
        message: "Get user successfully!",
        data: user,
      });
    } catch (error) {
      return res.status(500).json({
        code: 0,
        message: error.message,
      });
    }
  },

  // Lấy danh sách người dùng và tin nhắn cuối cùng
  getAllUsers: CatchError(async (req, res) => {
    try {
      const currentUserId = req.user.id;
      console.log("Current user ID:", currentUserId); // Để debug

      // Lấy tất cả người dùng trừ người dùng hiện tại
      const users = await User.find({
        _id: { $ne: currentUserId },
      }).select("username avatar email createdAt");

      console.log("Found users:", users); // Để debug

      // Lấy tin nhắn cuối cùng cho mỗi người dùng
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
            username: user.username,
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

      console.log("Users with messages:", usersWithLastMessage); // Để debug

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
};

export default UserController;
