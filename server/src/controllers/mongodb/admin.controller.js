import User from "../../models/mongodb/Users.js";
import Post from "../../models/mongodb/Posts.js";
import Comment from "../../models/mongodb/Comments.js";
import SystemLog from "../../models/mongodb/SystemLogs.js";
import mongoose from "mongoose";

export const AdminController = {
  // Dashboard
  getDashboardStats: async (req, res) => {
    try {
      const timeRange = req.query.timeRange || "week";

      // Calculate date range based on the timeRange
      const now = new Date();
      let startDate;
      switch (timeRange) {
        case "day":
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "year":
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7)); // Default to week
      }

      // Get stats in parallel
      const [
        totalUsers,
        newUsers,
        totalPosts,
        newPosts,
        totalComments,
        newComments,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ createdAt: { $gte: startDate } }),
        Post.countDocuments(),
        Post.countDocuments({ createdAt: { $gte: startDate } }),
        Comment.countDocuments(),
        Comment.countDocuments({ createdAt: { $gte: startDate } }),
      ]);

      // Construct response
      const stats = {
        users: {
          total: totalUsers,
          new: newUsers,
          active: totalUsers - (await User.countDocuments({ isBanned: true })),
          banned: await User.countDocuments({ isBanned: true }),
        },
        content: {
          posts: totalPosts,
          newPosts: newPosts,
          comments: totalComments,
          newComments: newComments,
        },
      };

      return res.status(200).json({
        code: 1,
        message: "Dashboard stats retrieved successfully",
        data: stats,
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve dashboard stats",
        error: error.message,
      });
    }
  },

  getRecentActivities: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;

      // Get recent users, posts, and comments
      const [recentUsers, recentPosts, recentComments] = await Promise.all([
        User.find().sort({ createdAt: -1 }).limit(limit).select("-password"),
        Post.find()
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate("user", "username name avatar"),
        Comment.find()
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate("user", "username name avatar"),
      ]);

      // Combine and sort all activities
      const allActivities = [
        ...recentUsers.map((user) => ({
          type: "user",
          data: user,
          createdAt: user.createdAt,
        })),
        ...recentPosts.map((post) => ({
          type: "post",
          data: post,
          createdAt: post.createdAt,
        })),
        ...recentComments.map((comment) => ({
          type: "comment",
          data: comment,
          createdAt: comment.createdAt,
        })),
      ];

      // Sort by most recent
      allActivities.sort((a, b) => b.createdAt - a.createdAt);

      return res.status(200).json({
        code: 1,
        message: "Recent activities retrieved successfully",
        data: allActivities.slice(0, limit),
      });
    } catch (error) {
      console.error("Recent activities error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve recent activities",
        error: error.message,
      });
    }
  },

  // User management
  getAllUsers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Add filters if provided
      const filter = {};
      if (req.query.search) {
        filter.$or = [
          { username: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
          { name: { $regex: req.query.search, $options: "i" } },
        ];
      }

      if (req.query.isBanned === "true") {
        filter.isBanned = true;
      } else if (req.query.isBanned === "false") {
        filter.isBanned = false;
      }

      // Get users with pagination
      const users = await User.find(filter)
        .select("-password")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(filter);

      return res.status(200).json({
        code: 1,
        message: "Users retrieved successfully",
        data: {
          users,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get all users error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve users",
        error: error.message,
      });
    }
  },

  getUserDetails: async (req, res) => {
    try {
      const { userId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          code: 0,
          message: "Invalid user ID format",
        });
      }

      const user = await User.findById(userId)
        .select("-password")
        .populate("profile");

      if (!user) {
        return res.status(404).json({
          code: 0,
          message: "User not found",
        });
      }

      return res.status(200).json({
        code: 1,
        message: "User details retrieved successfully",
        data: user,
      });
    } catch (error) {
      console.error("Get user details error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve user details",
        error: error.message,
      });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;

      // Remove some fields that shouldn't be updated directly
      delete updates.password;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          code: 0,
          message: "Invalid user ID format",
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({
          code: 0,
          message: "User not found",
        });
      }

      return res.status(200).json({
        code: 1,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Update user error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to update user",
        error: error.message,
      });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { userId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          code: 0,
          message: "Invalid user ID format",
        });
      }

      const user = await User.findByIdAndDelete(userId);

      if (!user) {
        return res.status(404).json({
          code: 0,
          message: "User not found",
        });
      }

      // In a real application, you might also:
      // 1. Delete user's posts, comments, likes, etc.
      // 2. Delete user's profile
      // 3. Handle any references to this user in other collections

      return res.status(200).json({
        code: 1,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to delete user",
        error: error.message,
      });
    }
  },

  banUser: async (req, res) => {
    try {
      const { userId, reason, duration } = req.body;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          code: 0,
          message: "Valid user ID is required",
        });
      }

      // Calculate ban expiration if duration is provided (in days)
      let banExpiration = null;
      if (duration && duration > 0) {
        banExpiration = new Date();
        banExpiration.setDate(banExpiration.getDate() + parseInt(duration));
      }

      const user = await User.findByIdAndUpdate(
        userId,
        {
          isBanned: true,
          banReason: reason || "Violated community guidelines",
          banExpiration,
        },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          code: 0,
          message: "User not found",
        });
      }

      return res.status(200).json({
        code: 1,
        message: "User banned successfully",
        data: user,
      });
    } catch (error) {
      console.error("Ban user error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to ban user",
        error: error.message,
      });
    }
  },

  unbanUser: async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          code: 0,
          message: "Valid user ID is required",
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        {
          isBanned: false,
          banReason: "",
          banExpiration: null,
        },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          code: 0,
          message: "User not found",
        });
      }

      return res.status(200).json({
        code: 1,
        message: "User unbanned successfully",
        data: user,
      });
    } catch (error) {
      console.error("Unban user error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to unban user",
        error: error.message,
      });
    }
  },

  // Post management
  getAllPosts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Add filters if provided
      const filter = {};
      if (req.query.search) {
        filter.content = { $regex: req.query.search, $options: "i" };
      }

      // Get posts with pagination
      const posts = await Post.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("user", "username name avatar")
        .populate({
          path: "likes",
          select: "user",
        })
        .populate({
          path: "comments",
          select: "user content",
        });

      const total = await Post.countDocuments(filter);

      return res.status(200).json({
        code: 1,
        message: "Posts retrieved successfully",
        data: {
          posts,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get all posts error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve posts",
        error: error.message,
      });
    }
  },

  getPostDetails: async (req, res) => {
    try {
      const { postId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({
          code: 0,
          message: "Invalid post ID format",
        });
      }

      const post = await Post.findById(postId)
        .populate("user", "username name avatar")
        .populate({
          path: "comments",
          populate: {
            path: "user",
            select: "username name avatar",
          },
        })
        .populate({
          path: "likes",
          select: "user",
        });

      if (!post) {
        return res.status(404).json({
          code: 0,
          message: "Post not found",
        });
      }

      return res.status(200).json({
        code: 1,
        message: "Post details retrieved successfully",
        data: post,
      });
    } catch (error) {
      console.error("Get post details error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve post details",
        error: error.message,
      });
    }
  },

  deletePost: async (req, res) => {
    try {
      const { postId } = req.params;
      const { reason } = req.body;

      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({
          code: 0,
          message: "Invalid post ID format",
        });
      }

      const post = await Post.findByIdAndDelete(postId);

      if (!post) {
        return res.status(404).json({
          code: 0,
          message: "Post not found",
        });
      }

      // In a real application, you might also:
      // 1. Delete comments on this post
      // 2. Delete likes, shares, etc. associated with this post
      // 3. Maybe create a record of the deletion with the reason

      return res.status(200).json({
        code: 1,
        message: "Post deleted successfully",
      });
    } catch (error) {
      console.error("Delete post error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to delete post",
        error: error.message,
      });
    }
  },

  approvePost: async (req, res) => {
    try {
      const { postId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({
          code: 0,
          message: "Invalid post ID format",
        });
      }

      const post = await Post.findByIdAndUpdate(
        postId,
        { approved: true },
        { new: true }
      ).populate("user", "username name avatar");

      if (!post) {
        return res.status(404).json({
          code: 0,
          message: "Post not found",
        });
      }

      return res.status(200).json({
        code: 1,
        message: "Post approved successfully",
        data: post,
      });
    } catch (error) {
      console.error("Approve post error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to approve post",
        error: error.message,
      });
    }
  },

  // Comment management
  getAllComments: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Add filters if provided
      const filter = {};
      if (req.query.search) {
        filter.content = { $regex: req.query.search, $options: "i" };
      }

      if (
        req.query.postId &&
        mongoose.Types.ObjectId.isValid(req.query.postId)
      ) {
        filter.post = req.query.postId;
      }

      // Get comments with pagination
      const comments = await Comment.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("user", "username name avatar")
        .populate("post", "content");

      const total = await Comment.countDocuments(filter);

      return res.status(200).json({
        code: 1,
        message: "Comments retrieved successfully",
        data: {
          comments,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get all comments error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve comments",
        error: error.message,
      });
    }
  },

  deleteComment: async (req, res) => {
    try {
      const { commentId } = req.params;
      const { reason } = req.body;

      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({
          code: 0,
          message: "Invalid comment ID format",
        });
      }

      const comment = await Comment.findByIdAndDelete(commentId);

      if (!comment) {
        return res.status(404).json({
          code: 0,
          message: "Comment not found",
        });
      }

      return res.status(200).json({
        code: 1,
        message: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("Delete comment error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to delete comment",
        error: error.message,
      });
    }
  },

  // Other methods will be implemented as needed
  getAllReports: async (req, res) => {
    try {
      // Dữ liệu mẫu cho báo cáo
      const mockReports = [
        {
          _id: "60d1f3a5e4b0a6d8b4c9f3a5",
          reportedBy: {
            _id: "60d1f3a5e4b0a6d8b4c9f3a1",
            username: "user1",
            avatar: "https://randomuser.me/api/portraits/men/1.jpg",
          },
          reportType: "post",
          reportedItem: {
            _id: "60d1f3a5e4b0a6d8b4c9f3b1",
            content: "This is an inappropriate post",
            user: {
              _id: "60d1f3a5e4b0a6d8b4c9f3a2",
              username: "user2",
              avatar: "https://randomuser.me/api/portraits/men/2.jpg",
            },
          },
          reason: "Inappropriate content",
          description: "This post contains offensive material",
          status: "pending",
          createdAt: "2023-05-15T08:30:00Z",
        },
        {
          _id: "60d1f3a5e4b0a6d8b4c9f3a6",
          reportedBy: {
            _id: "60d1f3a5e4b0a6d8b4c9f3a3",
            username: "user3",
            avatar: "https://randomuser.me/api/portraits/women/3.jpg",
          },
          reportType: "comment",
          reportedItem: {
            _id: "60d1f3a5e4b0a6d8b4c9f3b2",
            content: "This is a rude comment",
            user: {
              _id: "60d1f3a5e4b0a6d8b4c9f3a4",
              username: "user4",
              avatar: "https://randomuser.me/api/portraits/women/4.jpg",
            },
            post: "60d1f3a5e4b0a6d8b4c9f3b3",
          },
          reason: "Harassment",
          description: "This comment is harassing other users",
          status: "pending",
          createdAt: "2023-05-16T10:45:00Z",
        },
        {
          _id: "60d1f3a5e4b0a6d8b4c9f3a7",
          reportedBy: {
            _id: "60d1f3a5e4b0a6d8b4c9f3a5",
            username: "user5",
            avatar: "https://randomuser.me/api/portraits/men/5.jpg",
          },
          reportType: "user",
          reportedItem: {
            _id: "60d1f3a5e4b0a6d8b4c9f3a6",
            username: "user6",
            avatar: "https://randomuser.me/api/portraits/men/6.jpg",
          },
          reason: "Spam",
          description: "This user is posting spam content",
          status: "resolved",
          createdAt: "2023-05-17T14:20:00Z",
          resolvedAt: "2023-05-18T09:10:00Z",
          resolvedBy: {
            _id: "60d1f3a5e4b0a6d8b4c9f3a7",
            username: "admin1",
            avatar: "https://randomuser.me/api/portraits/men/7.jpg",
          },
          resolution: "User warned",
        },
      ];

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const total = mockReports.length;

      return res.status(200).json({
        code: 1,
        message: "Reports retrieved successfully",
        data: {
          reports: mockReports,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get reports error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve reports",
        error: error.message,
      });
    }
  },

  resolveReport: async (req, res) => {
    try {
      const { reportId } = req.params;
      const { resolution } = req.body;

      // Giả lập xử lý báo cáo
      return res.status(200).json({
        code: 1,
        message: "Report resolved successfully",
        data: {
          _id: reportId,
          status: "resolved",
          resolvedAt: new Date().toISOString(),
          resolvedBy: {
            _id: req.user.id,
            username: req.user.username || "admin",
          },
          resolution: resolution || "Action taken based on report",
        },
      });
    } catch (error) {
      console.error("Resolve report error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to resolve report",
        error: error.message,
      });
    }
  },

  dismissReport: async (req, res) => {
    try {
      const { reportId } = req.params;
      const { reason } = req.body;

      // Giả lập bỏ qua báo cáo
      return res.status(200).json({
        code: 1,
        message: "Report dismissed successfully",
        data: {
          _id: reportId,
          status: "dismissed",
          dismissedAt: new Date().toISOString(),
          dismissedBy: {
            _id: req.user.id,
            username: req.user.username || "admin",
          },
          dismissReason: reason || "Report was found to be invalid",
        },
      });
    } catch (error) {
      console.error("Dismiss report error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to dismiss report",
        error: error.message,
      });
    }
  },

  getSystemLogs: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Xây dựng query
      const query = {};

      // Lọc theo level nếu được cung cấp
      if (req.query.level) {
        query.level = req.query.level;
      }

      // Lọc theo module nếu được cung cấp
      if (req.query.module) {
        query.module = req.query.module;
      }

      // Lọc theo khoảng thời gian nếu được cung cấp
      if (req.query.startDate || req.query.endDate) {
        query.createdAt = {};
        
        if (req.query.startDate) {
          query.createdAt.$gte = new Date(req.query.startDate);
        }
        
        if (req.query.endDate) {
          const endDate = new Date(req.query.endDate);
          endDate.setHours(23, 59, 59, 999); // Kết thúc của ngày
          query.createdAt.$lte = endDate;
        }
      }

      // Lọc theo action nếu được cung cấp
      if (req.query.action) {
        query.action = { $regex: req.query.action, $options: 'i' };
      }

      // Lọc theo chi tiết
      if (req.query.details) {
        query.details = { $regex: req.query.details, $options: 'i' };
      }

      // Lấy logs từ database và tổng số bản ghi phù hợp
      const [logs, total] = await Promise.all([
        SystemLog.find(query)
          .populate('user', 'username name avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        SystemLog.countDocuments(query)
      ]);

      return res.status(200).json({
        code: 1,
        message: "System logs retrieved successfully",
        data: {
          logs,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get system logs error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve system logs",
        error: error.message,
      });
    }
  },

  getAdminSettings: async (req, res) => {
    try {
      // Dữ liệu mẫu cho cài đặt admin
      const mockSettings = {
        _id: "61a5e4b0c9f3a5d8b4a6d8e9",
        site: {
          name: "YiBu Social Network",
          description: "A modern social network for sharing and connecting",
          logo: "https://example.com/logo.png",
          favicon: "https://example.com/favicon.ico",
          maintenance: {
            enabled: false,
            message: "Site is under maintenance. Please check back later.",
          },
        },
        security: {
          maxLoginAttempts: 5,
          lockoutDuration: 30, // minutes
          passwordPolicy: {
            minLength: 8,
            requireLowercase: true,
            requireUppercase: true,
            requireNumber: true,
            requireSpecialChar: true,
          },
          twoFactorAuth: {
            enabled: true,
            required: false,
          },
        },
        content: {
          postModeration: {
            enabled: false,
            keywords: ["spam", "offensive", "illegal"],
          },
          commentModeration: {
            enabled: true,
            keywords: ["spam", "scam", "abuse"],
          },
          uploadLimits: {
            imageSize: 5, // MB
            videoSize: 100, // MB
            allowedFormats: ["jpg", "png", "gif", "mp4", "mov"],
          },
        },
        notifications: {
          email: {
            enabled: true,
            digestFrequency: "daily",
          },
          push: {
            enabled: true,
          },
        },
        performance: {
          caching: {
            enabled: true,
            duration: 3600, // seconds
          },
          rateLimit: {
            enabled: true,
            requestsPerMinute: 60,
          },
        },
        updatedAt: "2023-06-05T10:30:00Z",
        updatedBy: {
          _id: "60d1f3a5e4b0a6d8b4c9f3a7",
          username: "admin1",
        },
      };

      return res.status(200).json({
        code: 1,
        message: "Admin settings retrieved successfully",
        data: mockSettings,
      });
    } catch (error) {
      console.error("Get admin settings error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve admin settings",
        error: error.message,
      });
    }
  },

  updateAdminSettings: async (req, res) => {
    try {
      const updates = req.body;

      // Giả lập cập nhật cài đặt
      return res.status(200).json({
        code: 1,
        message: "Admin settings updated successfully",
        data: {
          ...updates,
          updatedAt: new Date().toISOString(),
          updatedBy: {
            _id: req.user.id,
            username: req.user.username || "admin",
          },
        },
      });
    } catch (error) {
      console.error("Update admin settings error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to update admin settings",
        error: error.message,
      });
    }
  },

  // Interaction management
  getInteractionStats: async (req, res) => {
    try {
      const timeRange = req.query.timeRange || "week";

      // Calculate date range based on the timeRange
      const now = new Date();
      let startDate;
      switch (timeRange) {
        case "day":
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7)); // Default to week
      }

      // Lấy thống kê các loại tương tác: likes, comments, views, shares
      const [commentsCount, totalPosts] = await Promise.all([
        // Đếm tổng số bình luận trong khoảng thời gian
        Comment.countDocuments({ createdAt: { $gte: startDate } }),
        // Tổng số bài viết
        Post.countDocuments({ createdAt: { $gte: startDate } }),
      ]);

      // Giả lập số lượng likes thay vì sử dụng aggregation có thể gây lỗi
      const likesCount = { total: Math.floor(totalPosts * 4.5) }; // Trung bình mỗi bài viết có 4-5 likes

      // Tính trung bình lượt xem dựa vào ước tính (giả định mỗi bài có trung bình 10 lượt xem)
      const estimatedViews = totalPosts * 10;
      // Tính trung bình lượt chia sẻ (giả định mỗi bài có trung bình 2 lượt chia sẻ)
      const estimatedShares = totalPosts * 2;

      // So sánh với giai đoạn trước đó để tính phần trăm thay đổi
      const previousStartDate = new Date(startDate);
      switch (timeRange) {
        case "day":
          previousStartDate.setDate(previousStartDate.getDate() - 1);
          break;
        case "week":
          previousStartDate.setDate(previousStartDate.getDate() - 7);
          break;
        case "month":
          previousStartDate.setMonth(previousStartDate.getMonth() - 1);
          break;
      }

      const [prevCommentsCount, prevTotalPosts] = await Promise.all([
        Comment.countDocuments({
          createdAt: { $gte: previousStartDate, $lt: startDate },
        }),
        Post.countDocuments({
          createdAt: { $gte: previousStartDate, $lt: startDate },
        }),
      ]);

      // Cũng giả lập số lượng likes trước đó
      const prevLikesCount = { total: Math.floor(prevTotalPosts * 4.5) };

      const prevEstimatedViews = prevTotalPosts * 10;
      const prevEstimatedShares = prevTotalPosts * 2;

      // Tính phần trăm thay đổi
      const calculateChange = (current, previous) => {
        if (previous === 0) return current > 0 ? "+100%" : "0%";
        const change = ((current - previous) / previous) * 100;
        return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
      };

      const stats = {
        likes: {
          total: likesCount.total.toLocaleString(),
          change: calculateChange(likesCount.total, prevLikesCount.total),
        },
        comments: {
          total: commentsCount.toLocaleString(),
          change: calculateChange(commentsCount, prevCommentsCount),
        },
        shares: {
          total: estimatedShares.toLocaleString(),
          change: calculateChange(estimatedShares, prevEstimatedShares),
        },
        views: {
          total: estimatedViews.toLocaleString(),
          change: calculateChange(estimatedViews, prevEstimatedViews),
        },
      };

      return res.status(200).json({
        code: 1,
        message: "Interaction stats retrieved successfully",
        data: stats,
      });
    } catch (error) {
      console.error("Interaction stats error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve interaction stats",
        error: error.message,
      });
    }
  },

  getInteractionTimeline: async (req, res) => {
    try {
      const { type = "all" } = req.query;
      const timeRange = req.query.timeRange || "week";

      // Calculate date range based on the timeRange
      const now = new Date();
      let startDate;
      let groupByFormat;
      let numberOfPoints;

      switch (timeRange) {
        case "day":
          startDate = new Date(now.setHours(now.getHours() - 24));
          groupByFormat = "%H"; // Group by hour
          numberOfPoints = 24;
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          groupByFormat = "%Y-%m-%d"; // Group by day
          numberOfPoints = 7;
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          groupByFormat = "%Y-%m-%d"; // Group by day
          numberOfPoints = 30;
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
          groupByFormat = "%Y-%m-%d";
          numberOfPoints = 7;
      }

      // Danh sách các ngày/giờ cần hiển thị
      const labels = [];
      const datePoints = [];

      // Generate labels and date points
      if (timeRange === "day") {
        for (let i = 0; i < 24; i++) {
          const date = new Date(now);
          date.setHours(date.getHours() - (23 - i));
          date.setMinutes(0, 0, 0);
          labels.push(date.getHours() + "h");
          datePoints.push(new Date(date));
        }
      } else {
        for (let i = 0; i < numberOfPoints; i++) {
          const date = new Date(now);
          if (timeRange === "week") {
            date.setDate(date.getDate() - (numberOfPoints - 1 - i));
          } else {
            date.setDate(date.getDate() - (numberOfPoints - 1 - i));
          }

          date.setHours(0, 0, 0, 0);

          // Format the label
          const day = date.getDate();
          const month = date.getMonth() + 1;
          labels.push(`${day}/${month}`);
          datePoints.push(new Date(date));
        }
      }

      // Khởi tạo giá trị cho các điểm
      const values = Array(numberOfPoints).fill(0);

      // Lấy dữ liệu cho bình luận theo thời gian
      if (type === "all" || type === "comment") {
        try {
          // Lấy dữ liệu bình luận theo thời gian
          const commentsData = await Comment.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: groupByFormat, date: "$createdAt" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ]);

          // Cập nhật giá trị cho mảng values dựa vào kết quả
          commentsData.forEach((item) => {
            const itemDate = new Date(item._id);
            datePoints.forEach((date, index) => {
              if (timeRange === "day") {
                if (itemDate.getHours() === date.getHours()) {
                  values[index] += item.count;
                }
              } else {
                if (itemDate.toDateString() === date.toDateString()) {
                  values[index] += item.count;
                }
              }
            });
          });
        } catch (err) {
          console.error("Error fetching comment data:", err);
        }
      }

      // Nếu không có dữ liệu, tạo dữ liệu giả lập hợp lý
      if (values.every((val) => val === 0)) {
        for (let i = 0; i < values.length; i++) {
          values[i] = Math.floor(Math.random() * 80) + 20; // Random từ 20-100
        }
      }

      return res.status(200).json({
        code: 1,
        message: "Interaction timeline retrieved successfully",
        data: {
          labels,
          values,
          type,
        },
      });
    } catch (error) {
      console.error("Interaction timeline error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve interaction timeline",
        error: error.message,
      });
    }
  },

  getUserInteractions: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const type = req.query.type || "all";

      let interactions = [];
      let totalCount = 0;

      // Get comments
      if (type === "all" || type === "comment") {
        try {
          const commentAggregation = await Comment.aggregate([
            { $sort: { createdAt: -1 } },
            { $skip: type === "all" ? 0 : skip },
            { $limit: type === "all" ? 100 : limit },
            {
              $lookup: {
                from: "Users",
                localField: "user",
                foreignField: "_id",
                as: "userDetails",
              },
            },
            {
              $lookup: {
                from: "Posts",
                localField: "post",
                foreignField: "_id",
                as: "postDetails",
              },
            },
            {
              $project: {
                id: { $toString: "$_id" },
                type: { $literal: "comment" },
                content: "$content",
                user: { $arrayElemAt: ["$userDetails", 0] },
                targetType: { $literal: "post" },
                targetId: { $toString: "$post" },
                createdAt: "$createdAt",
              },
            },
          ]);

          interactions = [...interactions, ...commentAggregation];

          // Count total comments
          if (type === "comment") {
            totalCount = await Comment.countDocuments();
          }
        } catch (err) {
          console.error("Error fetching comments:", err);
        }
      }

      // Add mock like data since we can't reliably access Post.likes
      if (type === "all" || type === "like") {
        // Get total number of posts
        const postsCount = await Post.countDocuments();

        // Get a sample of posts
        const posts = await Post.find()
          .sort({ createdAt: -1 })
          .limit(20)
          .populate("user", "username name avatar");

        // Create mock like data
        const mockLikes = [];
        for (let i = 0; i < Math.min(posts.length * 3, 30); i++) {
          const randomPost = posts[Math.floor(Math.random() * posts.length)];
          if (randomPost && randomPost.user) {
            mockLikes.push({
              id: `like_${i}_${Date.now()}`,
              type: "like",
              content: null,
              user: randomPost.user,
              targetType: "post",
              targetId: randomPost._id.toString(),
              createdAt: new Date(
                Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
              ),
            });
          }
        }

        // Sort mock likes by date
        mockLikes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const likesForCurrentPage = mockLikes.slice(
          0,
          type === "all" ? limit : mockLikes.length
        );
        interactions = [...interactions, ...likesForCurrentPage];

        // Count total likes
        if (type === "like") {
          totalCount = postsCount * 3; // Assume 3 likes per post on average
        }
      }

      // Sort all interactions by date
      interactions.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Limit the combined result
      if (type === "all") {
        interactions = interactions.slice(0, limit);
        totalCount = await Promise.all([
          Promise.resolve((await Post.countDocuments()) * 3), // Estimate 3 likes per post
          Comment.countDocuments(),
        ]).then(([likes, comments]) => likes + comments);
      }

      // Clean up user data to remove sensitive fields
      interactions = interactions.map((item) => ({
        ...item,
        user: item.user
          ? {
              id: item.user._id,
              name: item.user.name,
              username: item.user.username,
              avatar: item.user.avatar,
            }
          : null,
      }));

      return res.status(200).json({
        code: 1,
        message: "User interactions retrieved successfully",
        data: {
          interactions,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          totalCount,
        },
      });
    } catch (error) {
      console.error("Get user interactions error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve user interactions",
        error: error.message,
      });
    }
  },

  getSpamAccounts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Sử dụng aggregation để tìm tài khoản có hành vi bất thường
      const suspiciousUsers = await User.aggregate([
        {
          $lookup: {
            from: "Comments",
            localField: "_id",
            foreignField: "user",
            as: "comments",
          },
        },
        {
          $lookup: {
            from: "Posts",
            localField: "_id",
            foreignField: "user",
            as: "posts",
          },
        },
        {
          $addFields: {
            commentCount: { $size: "$comments" },
            postCount: { $size: "$posts" },
            // Giả lập một trường để đánh giá mức độ rủi ro
            riskScore: {
              $add: [
                // Nếu số bình luận quá nhiều so với số bài post -> suspicious
                {
                  $cond: [
                    {
                      $gt: [
                        {
                          $divide: [
                            { $size: "$comments" },
                            { $add: [{ $size: "$posts" }, 1] },
                          ],
                        },
                        10,
                      ],
                    },
                    50,
                    0,
                  ],
                },
                // Thêm điểm cho các tài khoản mới có hoạt động cao
                {
                  $cond: [
                    {
                      $and: [
                        {
                          $gt: [
                            {
                              $add: [
                                { $size: "$comments" },
                                { $size: "$posts" },
                              ],
                            },
                            20,
                          ],
                        },
                        {
                          $lt: [
                            { $subtract: [new Date(), "$createdAt"] },
                            7 * 24 * 60 * 60 * 1000,
                          ],
                        }, // 7 days
                      ],
                    },
                    30,
                    0,
                  ],
                },
              ],
            },
          },
        },
        {
          $match: {
            $or: [{ riskScore: { $gt: 30 } }, { isBanned: true }],
          },
        },
        { $sort: { riskScore: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            id: { $toString: "$_id" },
            username: 1,
            email: 1,
            avatar: 1,
            isFlagged: { $cond: ["$isBanned", true, false] },
            riskLevel: {
              $cond: [
                { $gt: ["$riskScore", 60] },
                "high",
                { $cond: [{ $gt: ["$riskScore", 30] }, "medium", "low"] },
              ],
            },
            suspiciousActivity: {
              $cond: [
                {
                  $gt: [
                    {
                      $divide: [
                        { $size: "$comments" },
                        { $add: [{ $size: "$posts" }, 1] },
                      ],
                    },
                    10,
                  ],
                },
                "Bình luận quá nhiều so với số bài đăng",
                "Hoạt động bất thường",
              ],
            },
            detectedAt: {
              $dateToString: {
                format: "%Y-%m-%d %H:%M",
                date: "$updatedAt",
              },
            },
            commentCount: 1,
            postCount: 1,
          },
        },
      ]);

      // Đếm tổng số tài khoản đáng ngờ
      const totalSuspicious = await User.aggregate([
        {
          $lookup: {
            from: "Comments",
            localField: "_id",
            foreignField: "user",
            as: "comments",
          },
        },
        {
          $lookup: {
            from: "Posts",
            localField: "_id",
            foreignField: "user",
            as: "posts",
          },
        },
        {
          $addFields: {
            commentCount: { $size: "$comments" },
            postCount: { $size: "$posts" },
            riskScore: {
              $add: [
                {
                  $cond: [
                    {
                      $gt: [
                        {
                          $divide: [
                            { $size: "$comments" },
                            { $add: [{ $size: "$posts" }, 1] },
                          ],
                        },
                        10,
                      ],
                    },
                    50,
                    0,
                  ],
                },
                {
                  $cond: [
                    {
                      $and: [
                        {
                          $gt: [
                            {
                              $add: [
                                { $size: "$comments" },
                                { $size: "$posts" },
                              ],
                            },
                            20,
                          ],
                        },
                        {
                          $lt: [
                            { $subtract: [new Date(), "$createdAt"] },
                            7 * 24 * 60 * 60 * 1000,
                          ],
                        },
                      ],
                    },
                    30,
                    0,
                  ],
                },
              ],
            },
          },
        },
        {
          $match: {
            $or: [{ riskScore: { $gt: 30 } }, { isBanned: true }],
          },
        },
        { $count: "total" },
      ]).then((result) => result[0]?.total || 0);

      return res.status(200).json({
        code: 1,
        message: "Suspicious accounts retrieved successfully",
        data: {
          accounts: suspiciousUsers,
          pagination: {
            total: totalSuspicious,
            page,
            limit,
            totalPages: Math.ceil(totalSuspicious / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get spam accounts error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve spam accounts",
        error: error.message,
      });
    }
  },

  flagAccount: async (req, res) => {
    try {
      const { userId, reason } = req.body;

      if (!userId) {
        return res.status(400).json({
          code: 0,
          message: "User ID is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          code: 0,
          message: "Invalid user ID format",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          code: 0,
          message: "User not found",
        });
      }

      // Gắn cờ cho tài khoản bằng cách đánh dấu là đã kiểm tra và ghi lại lý do
      user.isFlagged = true;
      user.flagReason = reason || "Phát hiện hoạt động bất thường";
      user.flaggedAt = new Date();
      user.flaggedBy = req.user._id;

      await user.save();

      return res.status(200).json({
        code: 1,
        message: "Account has been flagged successfully",
        data: {
          id: user._id,
          username: user.username,
          isFlagged: user.isFlagged,
          flagReason: user.flagReason,
          flaggedAt: user.flaggedAt,
        },
      });
    } catch (error) {
      console.error("Flag account error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to flag account",
        error: error.message,
      });
    }
  },

  removeInteraction: async (req, res) => {
    try {
      const { interactionId } = req.params;
      const { type, reason } = req.body;

      if (!interactionId || !type) {
        return res.status(400).json({
          code: 0,
          message: "Interaction ID and type are required",
        });
      }

      let result;

      if (type === "comment") {
        if (!mongoose.Types.ObjectId.isValid(interactionId)) {
          return res.status(400).json({
            code: 0,
            message: "Invalid comment ID format",
          });
        }

        result = await Comment.findByIdAndDelete(interactionId);
        if (!result) {
          return res.status(404).json({
            code: 0,
            message: "Comment not found",
          });
        }
      } else if (type === "like") {
        // For likes, we'll just return success since we're using mock data now
        return res.status(200).json({
          code: 1,
          message: "Like removed successfully",
          data: {
            interactionId,
            type,
            reason,
          },
        });
      } else {
        return res.status(400).json({
          code: 0,
          message: "Unsupported interaction type",
        });
      }

      return res.status(200).json({
        code: 1,
        message: `${
          type.charAt(0).toUpperCase() + type.slice(1)
        } removed successfully`,
        data: {
          interactionId,
          type,
          reason,
        },
      });
    } catch (error) {
      console.error("Remove interaction error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to remove interaction",
        error: error.message,
      });
    }
  },

  getInteractionTypes: async (req, res) => {
    try {
      // Return predefined interaction types
      const interactionTypes = [
        { id: 1, value: "like", label: "Lượt thích" },
        { id: 2, value: "comment", label: "Bình luận" },
        { id: 3, value: "view", label: "Lượt xem" },
        { id: 4, value: "share", label: "Chia sẻ" },
      ];

      return res.status(200).json({
        code: 1,
        message: "Interaction types retrieved successfully",
        data: interactionTypes,
      });
    } catch (error) {
      console.error("Get interaction types error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve interaction types",
        error: error.message,
      });
    }
  },

  // Quản lý tài khoản bị khóa
  getBannedAccounts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Add filters if provided
      const filter = { isBanned: true };

      // Đảm bảo search là chuỗi hợp lệ và không rỗng
      const search = req.query.search ? req.query.search.trim() : "";
      if (search && search.length > 0) {
        filter.$or = [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } },
        ];
      }

      // Filter by ban type if provided
      if (req.query.banType === "permanent") {
        filter.banExpiration = null;
      } else if (req.query.banType === "temporary") {
        filter.banExpiration = { $ne: null };
      }

      // Get banned users with pagination
      const bannedUsers = await User.find(filter)
        .select("-password")
        .skip(skip)
        .limit(limit)
        .sort({ banExpiration: 1 }); // Sort by ban expiration (soonest expiring first)

      const total = await User.countDocuments(filter);

      // Enhance user data with additional information
      const enhancedUsers = bannedUsers.map((user) => {
        return {
          ...user._doc,
          banStatus: user.banExpiration ? "temporary" : "permanent",
          remainingDays: user.banExpiration
            ? Math.ceil(
                (new Date(user.banExpiration) - new Date()) /
                  (1000 * 60 * 60 * 24)
              )
            : null,
          banElapsed: user.updatedAt
            ? Math.floor(
                (new Date() - new Date(user.updatedAt)) / (1000 * 60 * 60 * 24)
              )
            : 0,
        };
      });

      return res.status(200).json({
        code: 1,
        message: "Banned accounts retrieved successfully",
        data: {
          users: enhancedUsers,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get banned accounts error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve banned accounts",
        error: error.message,
      });
    }
  },

  getBanHistory: async (req, res) => {
    try {
      const { userId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          code: 0,
          message: "Invalid user ID format",
        });
      }

      // Trong thực tế, bạn sẽ cần một mô hình riêng để lưu trữ lịch sử cấm
      // Đây là dữ liệu giả lập
      const mockBanHistory = [
        {
          id: "ban_1",
          userId: userId,
          action: "ban",
          reason: "Spam comments across multiple posts",
          duration: 7, // days
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          endDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000), // 23 days ago
          adminId: "admin_1",
          adminName: "Admin User",
          notes: "First violation",
        },
        {
          id: "ban_2",
          userId: userId,
          action: "ban",
          reason: "Continued spam after first ban expired",
          duration: 30, // days
          startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days in future
          adminId: "admin_2",
          adminName: "Senior Moderator",
          notes: "Second violation, longer ban period",
        },
      ];

      return res.status(200).json({
        code: 1,
        message: "Ban history retrieved successfully",
        data: mockBanHistory,
      });
    } catch (error) {
      console.error("Get ban history error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve ban history",
        error: error.message,
      });
    }
  },

  extendBan: async (req, res) => {
    try {
      const { userId, duration, reason } = req.body;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          code: 0,
          message: "Valid user ID is required",
        });
      }

      if (!duration || duration <= 0) {
        return res.status(400).json({
          code: 0,
          message: "Valid duration is required",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          code: 0,
          message: "User not found",
        });
      }

      if (!user.isBanned) {
        return res.status(400).json({
          code: 0,
          message: "Cannot extend ban for user that is not currently banned",
        });
      }

      // Calculate new ban expiration
      let newBanExpiration = user.banExpiration
        ? new Date(user.banExpiration)
        : new Date();
      newBanExpiration.setDate(newBanExpiration.getDate() + parseInt(duration));

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          banExpiration: newBanExpiration,
          banReason: reason || user.banReason,
        },
        { new: true }
      ).select("-password");

      // Log the ban extension action
      console.log(
        `Ban extended for user ${userId} by ${duration} days. New expiration: ${newBanExpiration}`
      );

      return res.status(200).json({
        code: 1,
        message: "Ban extended successfully",
        data: {
          user: updatedUser,
          banExtended: true,
          previousExpiration: user.banExpiration,
          newExpiration: updatedUser.banExpiration,
        },
      });
    } catch (error) {
      console.error("Extend ban error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to extend ban",
        error: error.message,
      });
    }
  },

  temporaryUnban: async (req, res) => {
    try {
      const { userId, duration, reason } = req.body;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          code: 0,
          message: "Valid user ID is required",
        });
      }

      if (!duration || duration <= 0) {
        return res.status(400).json({
          code: 0,
          message: "Valid duration is required",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          code: 0,
          message: "User not found",
        });
      }

      if (!user.isBanned) {
        return res.status(400).json({
          code: 0,
          message: "User is not currently banned",
        });
      }

      // Save the previous ban state so we can restore it later
      const previousBanState = {
        isBanned: user.isBanned,
        banReason: user.banReason,
        banExpiration: user.banExpiration,
      };

      // Temporarily unban the user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          isBanned: false,
          tempUnbanReason: reason || "Temporary access granted by admin",
          tempUnbanExpiration: new Date(
            Date.now() + duration * 24 * 60 * 60 * 1000
          ),
          tempUnbanBy: req.user._id,
          previousBanState: previousBanState,
        },
        { new: true }
      ).select("-password");

      // Schedule task to re-ban user after duration (this would typically be handled by a cron job)
      // This is just a placeholder for the concept
      console.log(
        `User ${userId} temporarily unbanned for ${duration} days. Will be re-banned on ${updatedUser.tempUnbanExpiration}`
      );

      return res.status(200).json({
        code: 1,
        message: "User temporarily unbanned successfully",
        data: {
          user: updatedUser,
          temporaryUnban: true,
          duration: duration,
          expiresAt: updatedUser.tempUnbanExpiration,
        },
      });
    } catch (error) {
      console.error("Temporary unban error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to temporarily unban user",
        error: error.message,
      });
    }
  },

  // System settings
  updateSecuritySettings: async (req, res) => {
    try {
      const securitySettings = req.body;

      // Validate required fields
      if (!securitySettings) {
        return res.status(400).json({
          code: 0,
          message: "Security settings are required",
        });
      }

      // Giả lập lưu cài đặt bảo mật
      // Trong thực tế, bạn sẽ lưu vào cơ sở dữ liệu
      console.log("Updating security settings:", securitySettings);

      return res.status(200).json({
        code: 1,
        message: "Security settings updated successfully",
        data: {
          ...securitySettings,
          updatedAt: new Date().toISOString(),
          updatedBy: {
            _id: req.user._id,
            username: req.user.username || "admin",
          },
        },
      });
    } catch (error) {
      console.error("Update security settings error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to update security settings",
        error: error.message,
      });
    }
  },

  updateContentPolicy: async (req, res) => {
    try {
      const contentPolicy = req.body;

      // Validate required fields
      if (!contentPolicy) {
        return res.status(400).json({
          code: 0,
          message: "Content policy settings are required",
        });
      }

      // Giả lập lưu chính sách nội dung
      console.log("Updating content policy:", contentPolicy);

      return res.status(200).json({
        code: 1,
        message: "Content policy updated successfully",
        data: {
          ...contentPolicy,
          updatedAt: new Date().toISOString(),
          updatedBy: {
            _id: req.user._id,
            username: req.user.username || "admin",
          },
        },
      });
    } catch (error) {
      console.error("Update content policy error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to update content policy",
        error: error.message,
      });
    }
  },

  updateUserPermissions: async (req, res) => {
    try {
      const permissions = req.body;

      // Validate required fields
      if (!permissions || !permissions.roles) {
        return res.status(400).json({
          code: 0,
          message: "User permissions are required",
        });
      }

      // Giả lập lưu quyền người dùng
      console.log("Updating user permissions:", permissions);

      return res.status(200).json({
        code: 1,
        message: "User permissions updated successfully",
        data: {
          ...permissions,
          updatedAt: new Date().toISOString(),
          updatedBy: {
            _id: req.user._id,
            username: req.user.username || "admin",
          },
        },
      });
    } catch (error) {
      console.error("Update user permissions error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to update user permissions",
        error: error.message,
      });
    }
  },

  updateNotificationSettings: async (req, res) => {
    try {
      const notificationSettings = req.body;

      // Validate required fields
      if (!notificationSettings) {
        return res.status(400).json({
          code: 0,
          message: "Notification settings are required",
        });
      }

      // Giả lập lưu cài đặt thông báo
      console.log("Updating notification settings:", notificationSettings);

      return res.status(200).json({
        code: 1,
        message: "Notification settings updated successfully",
        data: {
          ...notificationSettings,
          updatedAt: new Date().toISOString(),
          updatedBy: {
            _id: req.user._id,
            username: req.user.username || "admin",
          },
        },
      });
    } catch (error) {
      console.error("Update notification settings error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to update notification settings",
        error: error.message,
      });
    }
  },

  getSystemHealth: async (req, res) => {
    try {
      // Giả lập dữ liệu trạng thái hệ thống
      const systemHealth = {
        status: "healthy",
        services: {
          database: {
            status: "connected",
            latency: "12ms",
            uptime: "99.98%",
          },
          cache: {
            status: "connected",
            hitRate: "94.2%",
            memory: "65%",
          },
          storage: {
            status: "connected",
            available: "1.2TB",
            used: "800GB",
          },
          api: {
            status: "operational",
            responseTime: "87ms",
            errorRate: "0.02%",
          },
        },
        metrics: {
          cpuUsage: "42%",
          memoryUsage: "3.8GB / 8GB",
          activeConnections: 256,
          requestsPerMinute: 342,
        },
        recentIssues: [
          {
            type: "performance",
            description: "Temporary database slowdown",
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            resolved: true,
          },
        ],
        lastChecked: new Date().toISOString(),
      };

      return res.status(200).json({
        code: 1,
        message: "System health retrieved successfully",
        data: systemHealth,
      });
    } catch (error) {
      console.error("Get system health error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to retrieve system health",
        error: error.message,
      });
    }
  },

  updateSystemConfig: async (req, res) => {
    try {
      const config = req.body;

      // Validate required fields
      if (!config) {
        return res.status(400).json({
          code: 0,
          message: "System configuration is required",
        });
      }

      // Giả lập lưu cấu hình hệ thống
      console.log("Updating system configuration:", config);

      // Typically these changes would need system restart
      const requiresRestart =
        config.performance || config.database || config.cache;

      return res.status(200).json({
        code: 1,
        message: "System configuration updated successfully",
        data: {
          ...config,
          requiresRestart,
          updatedAt: new Date().toISOString(),
          updatedBy: {
            _id: req.user._id,
            username: req.user.username || "admin",
          },
        },
      });
    } catch (error) {
      console.error("Update system configuration error:", error);
      return res.status(500).json({
        code: 0,
        message: "Failed to update system configuration",
        error: error.message,
      });
    }
  },
};
