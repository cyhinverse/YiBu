import mongoose from "mongoose";
import User from "../../models/mongodb/Users.js";
import Profiles from "../../models/mongodb/Profiles.js";
import Message from "../../models/mongodb/Messages.js";
import { CatchError } from "../../configs/CatchError.js";
import UserService from "../../services/User.Service.js";

const UserController = {
  GET_TOP_USERS_BY_LIKES: async (req, res) => {
    try {
      const topUsers = await UserService.getTopUsersByLikes();

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

      const enhancedUserData = await UserService.getUserById(id);

      return res.json({
        code: 1,
        message: "Get user successfully!",
        data: enhancedUserData,
      });
    } catch (error) {
      console.error("Error in Get_User_By_Id:", error);

      if (error.message === "User ID is required!") {
        return res.status(400).json({
          code: 0,
          message: error.message,
        });
      } else if (error.message === "User not found!") {
        return res.status(404).json({
          code: 0,
          message: error.message,
        });
      }

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

      const usersWithLastMessage = await UserService.getAllUsers(currentUserId);

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

      const formattedUsers = await UserService.searchUsers(
        query,
        currentUserId
      );

      res.status(200).json({
        success: true,
        data: formattedUsers,
      });
    } catch (error) {
      console.error("Error in searchUsers:", error);

      if (error.message === "Search query is required") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

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

      const isFollowing = await UserService.checkFollowStatus(
        currentUserId,
        targetUserId
      );

      return res.status(200).json({
        success: true,
        isFollowing: isFollowing,
      });
    } catch (error) {
      console.error("Error in checkFollowStatus:", error);

      if (error.message === "Không tìm thấy người dùng hiện tại") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to check follow status",
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
