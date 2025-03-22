import { CatchError } from "../../configs/CatchError.js";
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

        // Kiểm tra nếu like đã tồn tại
        console.log("Checking if like already exists...");
        const exists = await Likes.findOne({
          user: userObjectId,
          post: postObjectId,
        }).session(session);

        console.log("Existing like:", exists);

        if (exists) {
          console.log("Like already exists, aborting");
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            code: 2,
            message: "You already liked this post",
          });
        }

        // Kiểm tra post tồn tại
        console.log("Checking if post exists...");
        const post = await Post.findById(postObjectId).session(session);

        console.log("Post found:", post ? "Yes" : "No");

        if (!post) {
          console.log("Post not found, aborting");
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            code: 0,
            message: "Post not found",
          });
        }

        const postOwner = post.user.toString();
        console.log("Post owner ID:", postOwner);

        console.log("Creating new like...");
        const newLike = new Likes({
          user: userObjectId,
          post: postObjectId,
        });
        console.log("New like object:", newLike);

        try {
          await newLike.save({ session });
          console.log("Like saved successfully");
        } catch (saveError) {
          console.error("Error saving like:", saveError);
          throw saveError;
        }

        console.log("Counting likes for post...");
        const likeCount = await Likes.countDocuments({
          post: postObjectId,
        }).session(session);
        console.log("Like count:", likeCount);

        if (userId !== postOwner) {
          console.log("Creating notification for post owner...");
          const username = req.user.username || "Một người dùng";
          const notificationContent = `${username} đã thích bài viết của bạn`;

          // Tạo thông báo để lưu vào database
          const notification = new Notification({
            recipient: postOwner,
            sender: userId,
            type: "like",
            content: notificationContent,
            post: postObjectId,
            isRead: false,
          });

          try {
            // Lưu thông báo vào database
            await notification.save({ session });
            console.log("Notification saved successfully to database");

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
                media:
                  post.media && post.media.length > 0 ? [post.media[0]] : [],
              },
              isRead: false,
              createdAt: notification.createdAt || new Date(),
              updatedAt: notification.updatedAt || new Date(),
            };

            // Gửi thông báo bằng nhiều cách khác nhau để tăng khả năng nhận
            try {
              // 1. Gửi trực tiếp đến phòng của người nhận
              io.to(postOwner).emit("notification:new", notificationPayload);

              // 2. Gửi qua sự kiện cụ thể theo user
              io.emit(`user:${postOwner}:notification`, notificationPayload);

              // 3. Gửi bằng event tổng quát với custom event
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
              // Lỗi gửi thông báo không nên ngăn cản tiến trình chính
            }
          } catch (notifError) {
            console.error("Error saving notification:", notifError);
            // Tiếp tục mặc dù thông báo lỗi - không gây cản trở giao dịch
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

        // Gửi thông báo realtime qua socket với định dạng mới
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
          console.log(
            `Socket event post:like:update emitted to room post:${postId}`
          );

          // Thêm phát sóng toàn cục để đảm bảo tất cả người dùng đang xem bài viết nhận được cập nhật
          io.emit(`post:${postId}:like:update`, socketPayload);
          console.log(
            `Socket event post:${postId}:like:update emitted globally`
          );
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
        const exists = await Likes.findOne({
          user: userId,
          post: postId,
        }).session(session);
        if (!exists) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            code: 2,
            message: "You have not liked this post",
          });
        }

        await Likes.deleteOne({ _id: exists._id }).session(session);

        const likeCount = await Likes.countDocuments({ post: postId }).session(
          session
        );

        await session.commitTransaction();
        session.endSession();

        // Gửi thông báo realtime qua socket với định dạng mới
        const socketPayload = {
          postId,
          userId,
          count: likeCount,
          action: "unlike",
          timestamp: new Date(),
        };

        console.log("Emitting unlike update via socket:", socketPayload);

        // Phát sóng đến tất cả kết nối trong phòng post
        try {
          io.to(`post:${postId}`).emit("post:like:update", socketPayload);
          console.log(
            `Socket event post:like:update emitted to room post:${postId}`
          );

          // Thêm phát sóng toàn cục để đảm bảo tất cả người dùng đang xem bài viết nhận được cập nhật
          io.emit(`post:${postId}:like:update`, socketPayload);
          console.log(
            `Socket event post:${postId}:like:update emitted globally`
          );
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
      const like = await Likes.findOne({ user: userId, post: postId });

      const likeCount = await Likes.countDocuments({ post: postId });

      console.log(
        `[Server] Like status for post ${postId}, user ${userId}: isLiked=${!!like}, count=${likeCount}`
      );

      return res.status(200).json({
        code: 1,
        data: {
          isLiked: !!like,
          count: likeCount,
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

      const likeCounts = await Likes.aggregate([
        {
          $match: {
            post: { $in: sanitizedPostIds },
          },
        },
        {
          $group: {
            _id: "$post",
            count: { $sum: 1 },
            likedByUser: {
              $sum: {
                $cond: [
                  { $eq: ["$user", new mongoose.Types.ObjectId(userId)] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

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
};

export default LikeController;
