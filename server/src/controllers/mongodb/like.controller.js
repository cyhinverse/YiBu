import { CatchError } from "../../configs/CatchError.js";
import LikeService from "../../services/Like.service.js";
import Likes from "../../models/mongodb/Likes.js";
import Post from "../../models/mongodb/Posts.js";
import Notification from "../../models/mongodb/Notifications.js";
import { io } from "../../socket.js";
import mongoose from "mongoose";

const LikeController = {
  CreateLike: CatchError(async (req, res) => {
    console.log("=== CREATE LIKE REQUEST ===");
    console.log("Request body:", req.body);
    console.log("User from auth:", req.user);

    const { postId } = req.body;
    const userId = req.user.id;

    console.log("PostID from request:", postId);
    console.log("UserID from auth:", userId);

    if (!postId) {
      console.log("ERROR: Missing postId in request");
      return res.status(400).json({
        code: 3,
        message: "Post ID is required",
      });
    }

    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Đảm bảo postId và userId là ObjectId hợp lệ
        let postObjectId;
        let userObjectId;

        try {
          postObjectId = new mongoose.Types.ObjectId(postId);
          userObjectId = new mongoose.Types.ObjectId(userId);
          console.log(
            "Valid ObjectIDs - Post:",
            postObjectId,
            "User:",
            userObjectId
          );
        } catch (idError) {
          console.error("Invalid ObjectID format:", idError);
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            code: 4,
            message: "Invalid ID format",
            error: idError.message,
          });
        }

        // Sử dụng service để xử lý việc tạo like
        const { newLike, post, likeCount } = await LikeService.createLike(
          userId,
          postId,
          session,
          req.user
        );

        const postOwner = post.user.toString();
        console.log("Post owner ID:", postOwner);

        if (userId !== postOwner) {
          console.log("Creating notification for post owner...");
          const username = req.user.username || "Một người dùng";
          const notificationContent = `${username} đã thích bài viết của bạn`;

          // Tạo thông báo
          const notification = await LikeService.createNotification(
            postOwner,
            userId,
            notificationContent,
            postObjectId,
            session
          );

          // Tạo payload cho socket notification
          const notificationPayload = {
            _id: notification._id.toString(),
            recipient: postOwner,
            sender: {
              _id: userId,
              username: req.user.username,
              name: req.user.username,
              avatar: req.user.avatar || "https://via.placeholder.com/40",
            },
            type: "like",
            content: notificationContent,
            post: {
              _id: postId,
              caption: post.caption,
              media: post.media && post.media.length > 0 ? [post.media[0]] : [],
            },
            isRead: false,
            createdAt: notification.createdAt || new Date(),
            updatedAt: notification.updatedAt || new Date(),
          };

          // Gửi thông báo bằng nhiều cách khác nhau
          try {
            io.to(postOwner).emit("notification:new", notificationPayload);
            io.emit(`user:${postOwner}:notification`, notificationPayload);
            io.emit(`notification:to:${postOwner}`, notificationPayload);
            console.log(
              `Notification sent through multiple channels to ${postOwner}:`,
              notificationPayload
            );
          } catch (socketError) {
            console.error(
              "Error sending notification via socket:",
              socketError
            );
          }
        }

        console.log("Committing transaction...");
        try {
          await session.commitTransaction();
          console.log("Transaction committed successfully");
        } catch (commitError) {
          console.error("Error committing transaction:", commitError);
          throw commitError;
        } finally {
          session.endSession();
          console.log("Session ended");
        }

        // Gửi thông báo realtime qua socket
        const socketPayload = {
          postId,
          userId,
          count: likeCount,
          action: "like",
          timestamp: new Date(),
        };

        console.log("Emitting like update via socket:", socketPayload);

        // Phát sóng đến tất cả kết nối trong phòng post
        try {
          io.to(`post:${postId}`).emit("post:like:update", socketPayload);
          io.emit(`post:${postId}:like:update`, socketPayload);
          console.log(`Socket events emitted for post:${postId}`);
        } catch (socketError) {
          console.error("Error emitting socket event:", socketError);
        }

        console.log(
          `[Server] User ${userId} liked post ${postId}. New count: ${likeCount}`
        );

        return res.status(200).json({
          code: 1,
          message: "Liked successfully",
          data: {
            ...newLike.toJSON(),
            likeCount,
          },
        });
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error(`[Server] Error creating like:`, error);
      return res.status(500).json({
        code: 0,
        message: "Failed to like post",
        error: error.message,
      });
    }
  }, "Failed to like post"),

  DeleteLike: CatchError(async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({
        code: 3,
        message: "Post ID is required",
      });
    }

    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Sử dụng service để xóa like
        const { likeCount } = await LikeService.deleteLike(
          userId,
          postId,
          session
        );

        await session.commitTransaction();
        session.endSession();

        // Gửi thông báo realtime qua socket
        const socketPayload = {
          postId,
          userId,
          count: likeCount,
          action: "unlike",
          timestamp: new Date(),
        };

        console.log("Emitting unlike update via socket:", socketPayload);

        // Phát sóng đến tất cả kết nối
        try {
          io.to(`post:${postId}`).emit("post:like:update", socketPayload);
          io.emit(`post:${postId}:like:update`, socketPayload);
        } catch (socketError) {
          console.error("Error emitting socket event:", socketError);
        }

        console.log(
          `[Server] User ${userId} unliked post ${postId}. New count: ${likeCount}`
        );

        return res.status(200).json({
          code: 1,
          message: "Unlike successful",
          data: {
            likeCount,
          },
        });
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error(`[Server] Error deleting like:`, error);
      return res.status(500).json({
        code: 0,
        message: "Failed to unlike post",
        error: error.message,
      });
    }
  }, "Failed to unlike post"),

  GetLikeStatus: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({
        code: 3,
        message: "Post ID is required",
      });
    }

    try {
      // Sử dụng service để lấy trạng thái like
      const { isLiked, count } = await LikeService.getLikeStatus(
        userId,
        postId
      );

      console.log(
        `[Server] Like status for post ${postId}, user ${userId}: isLiked=${isLiked}, count=${count}`
      );

      return res.status(200).json({
        code: 1,
        data: {
          isLiked,
          count,
        },
      });
    } catch (error) {
      console.error(`[Server] Error getting like status:`, error);
      return res.status(500).json({
        code: 0,
        message: "Failed to get like status",
        error: error.message,
      });
    }
  }, "Failed to get like status"),

  GetAllLikeFromPosts: CatchError(async (req, res) => {
    const { postIds } = req.body;
    const userId = req.user.id;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        code: 3,
        message: "Valid post IDs array is required",
      });
    }

    try {
      const sanitizedPostIds = postIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );

      // Sử dụng service để lấy like từ các post
      const likeCounts = await LikeService.getAllLikesFromPosts(
        sanitizedPostIds,
        userId
      );

      const formattedResults = postIds.reduce((acc, postId) => {
        const postLikes = likeCounts.find(
          (item) => item._id.toString() === postId.toString()
        ) || {
          count: 0,
          likedByUser: 0,
        };

        acc[postId] = {
          count: postLikes.count || 0,
          isLiked: postLikes.likedByUser > 0,
        };
        return acc;
      }, {});

      console.log(`[Server] GetAllLikeFromPosts response:`, formattedResults);

      return res.status(200).json({
        code: 1,
        data: formattedResults,
      });
    } catch (error) {
      console.error(`[Server] Error getting likes for posts:`, error);
      return res.status(500).json({
        code: 0,
        message: "Failed to get post likes",
        error: error.message,
      });
    }
  }, "Failed to get post likes"),

  ToggleLike: CatchError(async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({
        code: 3,
        message: "Post ID is required",
      });
    }

    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Sử dụng service để toggle like
        const { post, action, message, likeCount } =
          await LikeService.toggleLike(userId, postId, session, req.user);

        // Tạo thông báo nếu đang thực hiện like và người like không phải chủ bài viết
        const postOwner = post.user.toString();
        if (action === "like" && userId !== postOwner) {
          const username = req.user.username || "Một người dùng";
          const notificationContent = `${username} đã thích bài viết của bạn`;

          // Tạo thông báo
          const notification = await LikeService.createNotification(
            postOwner,
            userId,
            notificationContent,
            new mongoose.Types.ObjectId(postId),
            session
          );

          // Payload cho socket
          const notificationPayload = {
            _id: notification._id.toString(),
            recipient: postOwner,
            sender: {
              _id: userId,
              username: req.user.username,
              name: req.user.username,
              avatar: req.user.avatar || "https://via.placeholder.com/40",
            },
            type: "like",
            content: notificationContent,
            post: {
              _id: postId,
              caption: post.caption,
              media: post.media && post.media.length > 0 ? [post.media[0]] : [],
            },
            isRead: false,
            createdAt: notification.createdAt || new Date(),
            updatedAt: notification.updatedAt || new Date(),
          };

          // Gửi thông báo qua socket
          try {
            io.to(postOwner).emit("notification:new", notificationPayload);
            io.emit(`user:${postOwner}:notification`, notificationPayload);
          } catch (socketError) {
            console.error(
              "Error sending notification via socket:",
              socketError
            );
          }
        }

        await session.commitTransaction();
        session.endSession();

        // Gửi thông báo qua socket
        const socketPayload = {
          postId,
          userId,
          count: likeCount,
          action: action,
          timestamp: new Date(),
        };

        try {
          io.to(`post:${postId}`).emit("post:like:update", socketPayload);
          io.emit(`post:${postId}:like:update`, socketPayload);
        } catch (socketError) {
          console.error("Error emitting socket event:", socketError);
        }

        return res.status(200).json({
          code: 1,
          message: message,
          data: {
            isLiked: action === "like",
            count: likeCount,
          },
        });
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error(`[Server] Error toggling like:`, error);
      return res.status(500).json({
        code: 0,
        message: "Failed to toggle like",
        error: error.message,
      });
    }
  }, "Toggle like failed!"),

  GetLikedPosts: CatchError(async (req, res) => {
    const userId = req.user.id;

    try {
      // Sử dụng service để lấy các post đã like
      const likedPosts = await LikeService.getLikedPosts(userId);

      return res.status(200).json({
        code: 1,
        message:
          likedPosts.length === 0
            ? "No liked posts found"
            : "Liked posts retrieved successfully",
        posts: likedPosts,
      });
    } catch (error) {
      console.error(`[Server] Error getting liked posts:`, error);
      return res.status(500).json({
        code: 0,
        message: "Failed to get liked posts",
        error: error.message,
      });
    }
  }, "Get liked posts failed!"),
};

export default LikeController;
