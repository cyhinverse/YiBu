import mongoose from "mongoose";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Likes from "../models/Like.js";
import SavePost from "../models/SavePost.js";
import Notification from "../models/Notification.js";
import Hashtags from "../models/Hashtag.js";
import SocketService from "./Socket.Service.js";
import { getPaginationResponse } from "../helpers/pagination.js";
import logger from "../configs/logger.js";

class PostService {
  // ======================================
  // Post Core Methods
  // ======================================
  static async getAllPosts(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const totalPosts = await Post.countDocuments();
      const totalPages = Math.ceil(totalPosts / limit);

      const posts = await Post.find()
        .populate({
          path: "user",
          select: "name followers following profile.avatar",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const { pagination } = getPaginationResponse({ data: posts, total: totalPosts, page, limit });

      return {
        posts,
        pagination,
      };
    } catch (error) {
      logger.error("Error getting all posts:", error);
      throw error;
    }
  }

  static async getPostsByUserId(userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required!");
      }

      const postOfUser = await Post.find({
        user: new mongoose.Types.ObjectId(userId),
      })
        .populate({
          path: "user",
          select: "name profile.avatar",
        })
        .sort({ createdAt: -1 })
        .lean();

      if (!postOfUser) {
        throw new Error("No posts found for this user!");
      }

      return postOfUser;
    } catch (error) {
      logger.error("Error getting posts by user ID:", error);
      throw error;
    }
  }

  static async deletePost(postId) {
    try {
      const post = await Post.findByIdAndDelete(postId);
      if (!post) {
        throw new Error("Post not found");
      }
      return post;
    } catch (error) {
      logger.error("Error deleting post:", error);
      throw error;
    }
  }

  static async updatePost(postId, updateData) {
    try {
      const post = await Post.findByIdAndUpdate(postId, updateData, {
        new: true,
      });
      if (!post) {
        throw new Error("Post not found");
      }
      return post;
    } catch (error) {
      logger.error("Error updating post:", error);
      throw error;
    }
  }

  static async createPost(userData, postData, files) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userData.id);
      const { caption, tags } = postData;

      if (!caption || caption.trim() === "") {
        throw new Error("Title là bắt buộc");
      }

      const mediaPaths = files?.length
        ? files.map((file) => ({
            url: file.path,
            type: file.mimetype.includes("image") ? "image" : "video",
          }))
        : [];

      const newPost = new Post({
        user: userObjectId,
        caption: caption,
        media: mediaPaths,
        tags: Array.isArray(tags) ? tags : [],
      });

      await newPost.save();

      const populatedPost = await Post.findById(newPost._id)
        .populate("user", "name followers following profile.avatar")
        .lean();

      return populatedPost;
    } catch (error) {
      logger.error("Error creating post:", error);
      throw error;
    }
  }

  static async getPostById(postId) {
    try {
      const post = await Post.findById(postId)
        .populate("user", "name followers following profile.avatar")
        .lean();
      if (!post) {
        throw new Error("Post not found");
      }
      return post;
    } catch (error) {
      logger.error("Error getting post by ID:", error);
      throw error;
    }
  }

  static async deletePost(postId) {
    try {
      const post = await Post.findByIdAndDelete(postId);
      if (!post) {
        throw new Error("Post not found");
      }

      // Cleanup related data
      await Promise.all([
        Comment.deleteMany({ post: postId }),
        Likes.deleteMany({ post: postId }),
        SavePost.deleteMany({ post: postId }),
        Notification.deleteMany({ post: postId }),
      ]);

      return post;
    } catch (error) {
      logger.error("Error deleting post:", error);
      throw error;
    }
  }

  // ======================================
  // Comment Methods (Merged from CommentService)
  // ======================================
  static async createComment(userId, content, postId, parentComment) {
    try {
      if (!content || content.trim() === "") {
        throw new Error("Nội dung comment không được để trống");
      }

      if (!postId) {
        throw new Error("ID bài viết là bắt buộc");
      }

      // Kiểm tra xem bài viết có tồn tại không
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error("Bài viết không tồn tại");
      }

      // Tạo comment mới
      const newComment = new Comment({
        user: new mongoose.Types.ObjectId(userId),
        content,
        post: new mongoose.Types.ObjectId(postId),
        parentComment: parentComment
          ? new mongoose.Types.ObjectId(parentComment)
          : null,
      });

      await newComment.save();

      // Cập nhật số lượng comment của bài viết
      const commentCount = await Comment.countDocuments({ post: postId });

      // Truy vấn comment đã tạo với thông tin người dùng
      const populatedComment = await Comment.findById(newComment._id)
        .populate({
          path: "user",
          select: "name profile.avatar",
        })
        .lean();

      // Emit sự kiện "new_comment" qua socket
      SocketService.emitToRoom(`post:${postId}`, "new_comment", {
        comment: populatedComment,
        postId,
        commentCount,
        action: "create",
      });

      return {
        comment: populatedComment,
        commentCount,
      };
    } catch (error) {
      logger.error("Error in createComment:", error);
      throw error;
    }
  }

  static async getCommentsByPostId(postId) {
    try {
      if (!postId) {
        throw new Error("ID bài viết là bắt buộc");
      }

      // Kiểm tra xem bài viết có tồn tại không
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error("Bài viết không tồn tại");
      }

      // Lấy tất cả comments cho bài viết
      const comments = await Comment.find({
        post: new mongoose.Types.ObjectId(postId),
      })
        .populate({
          path: "user",
          select: "name profile.avatar",
        })
        .populate({
          path: "parentComment",
          populate: {
            path: "user",
            select: "name profile.avatar",
          },
        })
        .sort({ createdAt: -1 })
        .lean();

      // Tổ chức comments thành cây (root comments và replies)
      const rootComments = comments.filter((comment) => !comment.parentComment);
      const replies = comments.filter((comment) => comment.parentComment);

      // Đối với mỗi comment gốc, thêm replies tương ứng
      const commentTree = rootComments.map((rootComment) => {
        const commentReplies = replies.filter(
          (reply) =>
            reply.parentComment &&
            reply.parentComment._id.toString() === rootComment._id.toString()
        );
        return {
          ...rootComment,
          replies: commentReplies,
        };
      });

      // Tính tổng số comment (bao gồm cả replies)
      const commentCount = comments.length;

      return {
        comments: commentTree,
        commentCount,
      };
    } catch (error) {
      logger.error("Error in getCommentsByPostId:", error);
      throw error;
    }
  }

  static async updateComment(commentId, content, userId) {
    try {
      if (!content || content.trim() === "") {
        throw new Error("Nội dung comment không được để trống");
      }

      // Tìm comment cần cập nhật
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new Error("Comment không tồn tại");
      }

      // Kiểm tra xem người dùng có quyền cập nhật comment không
      if (comment.user.toString() !== userId) {
        throw new Error("Bạn không có quyền cập nhật comment này");
      }

      // Cập nhật comment
      comment.content = content;
      await comment.save();

      const updatedComment = await Comment.findById(commentId)
        .populate({
          path: "user",
          select: "name profile.avatar",
        })
        .lean();

      // Lấy postId từ comment
      const postId = comment.post.toString();

      // Đếm số lượng comment của bài viết
      const commentCount = await Comment.countDocuments({ post: postId });

      // Emit sự kiện "update_comment" qua socket
      SocketService.emitToRoom(`post:${postId}`, "update_comment", {
        comment: updatedComment,
        postId,
        commentCount,
        action: "update",
      });

      return {
        comment: updatedComment,
        postId,
      };
    } catch (error) {
      logger.error("Error in updateComment:", error);
      throw error;
    }
  }

  static async deleteComment(commentId, userId) {
    try {
      // Tìm comment cần xóa
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new Error("Comment không tồn tại");
      }

      // Kiểm tra xem người dùng có quyền xóa comment không
      if (comment.user.toString() !== userId) {
        throw new Error("Bạn không có quyền xóa comment này");
      }

      // Lưu postId trước khi xóa comment
      const postId = comment.post.toString();

      // Xóa tất cả reply của comment này
      await Comment.deleteMany({ parentComment: comment._id });

      // Xóa comment
      await Comment.findByIdAndDelete(commentId);

      // Đếm số lượng comment còn lại của bài viết
      const commentCount = await Comment.countDocuments({ post: postId });

      // Emit sự kiện "delete_comment" qua socket
      SocketService.emitToRoom(`post:${postId}`, "delete_comment", {
        commentId,
        postId,
        commentCount,
        action: "delete",
      });

      return {
        commentId,
        postId,
        commentCount,
      };
    } catch (error) {
      logger.error("Error in deleteComment:", error);
      throw error;
    }
  }

  // ======================================
  // Like Methods (Merged from LikeService)
  // ======================================
  static async createLike(userId, postId, session, userData) {
    // Đảm bảo postId và userId là ObjectId hợp lệ
    const postObjectId = new mongoose.Types.ObjectId(postId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Kiểm tra nếu like đã tồn tại
    const exists = await Likes.findOne({
      user: userObjectId,
      post: postObjectId,
    }).session(session);

    if (exists) {
      throw new Error("You already liked this post");
    }

    // Kiểm tra post tồn tại
    const post = await Post.findById(postObjectId).session(session);
    if (!post) {
      throw new Error("Post not found");
    }

    // Tạo like mới
    const newLike = new Likes({
      user: userObjectId,
      post: postObjectId,
    });

    await newLike.save({ session });

    // Đếm số like
    const likeCount = await Likes.countDocuments({
      post: postObjectId,
    }).session(session);

    // Trả về thông tin cần thiết
    return {
      newLike,
      post,
      likeCount,
    };
  }

  static async deleteLike(userId, postId, session) {
    // Tìm like hiện tại
    const like = await Likes.findOne({
      user: userId,
      post: postId,
    }).session(session);

    if (!like) {
      throw new Error("You have not liked this post");
    }

    // Xóa like
    await Likes.deleteOne({ _id: like._id }).session(session);

    // Đếm số like còn lại
    const likeCount = await Likes.countDocuments({ post: postId }).session(
      session
    );

    return { likeCount };
  }

  static async getLikeStatus(userId, postId) {
    const like = await Likes.findOne({ user: userId, post: postId });
    const likeCount = await Likes.countDocuments({ post: postId });

    return {
      isLiked: !!like,
      count: likeCount,
    };
  }

  static async getAllLikesFromPosts(postIds, userId) {
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

    return likeCounts;
  }

  static async toggleLike(userId, postId, session, userData) {
    const postObjectId = new mongoose.Types.ObjectId(postId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Kiểm tra post tồn tại
    const post = await Post.findById(postObjectId).session(session);
    if (!post) {
      throw new Error("Post not found");
    }

    // Kiểm tra like hiện tại
    const existingLike = await Likes.findOne({
      user: userObjectId,
      post: postObjectId,
    }).session(session);

    let action = "";
    let message = "";

    // Xử lý dựa trên trạng thái hiện tại
    if (existingLike) {
      // Bỏ like
      await Likes.findByIdAndDelete(existingLike._id).session(session);
      action = "unlike";
      message = "Unliked successfully";
    } else {
      // Thêm like
      const newLike = new Likes({
        user: userObjectId,
        post: postObjectId,
      });
      await newLike.save({ session });

      action = "like";
      message = "Liked successfully";
    }

    // Đếm lại số like
    const likeCount = await Likes.countDocuments({
      post: postObjectId,
    }).session(session);

    return {
      post,
      action,
      message,
      likeCount,
    };
  }

  static async getLikedPosts(userId) {
    // Tìm tất cả like của người dùng
    const userLikes = await Likes.find({
      user: new mongoose.Types.ObjectId(userId),
    }).sort({ createdAt: -1 });

    if (!userLikes || userLikes.length === 0) {
      return [];
    }

    // Lấy id của các bài viết đã like
    const postIds = userLikes.map((like) => like.post);

    // Tìm các bài viết
    const likedPosts = await Post.find({
      _id: { $in: postIds },
    })
      .populate({
        path: "user",
        select: "name profile.avatar",
      })
      .sort({ createdAt: -1 });

    return likedPosts;
  }

  static async createNotification(recipient, sender, content, postId, session) {
    const notification = new Notification({
      recipient,
      sender,
      type: "like",
      content,
      post: postId,
      isRead: false,
    });

    await notification.save({ session });
    return notification;
  }

  // Transactional wrappers for Like actions
  static async likePost(userId, postId, currentUser) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { newLike, post, likeCount } = await this.createLike(userId, postId, session);
      
      const postOwner = post.user.toString();
      
      // Notify if not self-like
      if (userId !== postOwner) {
        const username = currentUser.username || "Một người dùng";
        const notificationContent = `${username} đã thích bài viết của bạn`;
        
        const notification = await this.createNotification(
          postOwner,
          userId,
          notificationContent,
          new mongoose.Types.ObjectId(postId),
          session
        );

        const notificationPayload = {
          _id: notification._id.toString(),
          recipient: postOwner,
          sender: {
            _id: userId,
            username: currentUser.username,
            name: currentUser.name || currentUser.username,
            avatar: currentUser.avatar || "https://via.placeholder.com/40",
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

        try {
          SocketService.emitNotification(postOwner, notificationPayload);
          SocketService.emit(`notification:to:${postOwner}`, notificationPayload);
        } catch (socketError) {
          logger.error("Error sending notification via socket:", socketError);
        }
      }

      await session.commitTransaction();
      session.endSession();

      try {
        SocketService.emitPostLikeUpdate(postId, userId, "like");
      } catch (socketError) {
        logger.error("Error emitting socket event:", socketError);
      }

      logger.info(`[Server] User ${userId} liked post ${postId}. New count: ${likeCount}`);
      
      return { newLike, likeCount };

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async unlikePost(userId, postId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { likeCount } = await this.deleteLike(userId, postId, session);

      await session.commitTransaction();
      session.endSession();

      try {
        SocketService.emitPostLikeUpdate(postId, userId, "unlike");
      } catch (socketError) {
        logger.error("Error emitting socket event:", socketError);
      }

      logger.info(`[Server] User ${userId} unliked post ${postId}. New count: ${likeCount}`);
      
      return { likeCount };

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async toggleLikePost(userId, postId, currentUser) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { post, action, message, likeCount } = await this.toggleLike(userId, postId, session);

      const postOwner = post.user.toString();
      if (action === "like" && userId !== postOwner) {
        const username = currentUser.username || "Một người dùng";
        const notificationContent = `${username} đã thích bài viết của bạn`;
        
        const notification = await this.createNotification(
          postOwner,
          userId,
          notificationContent,
          new mongoose.Types.ObjectId(postId),
          session
        );

        const notificationPayload = {
          _id: notification._id.toString(),
          recipient: postOwner,
          sender: {
             _id: userId,
             username: currentUser.username,
             name: currentUser.name || currentUser.username,
             avatar: currentUser.avatar || "https://via.placeholder.com/40",
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

        try {
          SocketService.emitNotification(postOwner, notificationPayload);
        } catch (socketError) {
          logger.error("Error sending notification via socket:", socketError);
        }
      }

      await session.commitTransaction();
      session.endSession();

      try {
        SocketService.emitPostLikeUpdate(postId, userId, action);
      } catch (socketError) {
        logger.error("Error emitting socket event:", socketError);
      }

      return {
        isLiked: action === "like",
        count: likeCount,
        message
      };

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // ======================================
  // SavePost Methods (Merged from SavePostService)
  // ======================================
  static async savePost(userId, postId) {
    // Kiểm tra post có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Bài viết không tồn tại");
    }

    // Kiểm tra đã save chưa
    const existingSave = await SavePost.findOne({
      user: userId,
      post: postId,
    });

    if (existingSave) {
      throw new Error("Bài viết đã được lưu trước đó");
    }

    // Lưu bài viết
    const savedPost = await SavePost.create({ user: userId, post: postId });
    await savedPost.populate({
      path: "post",
      populate: {
        path: "user",
        select: "name profile.avatar",
      },
    });

    return { post, savedPost };
  }

  static async createSaveNotification(recipientId, senderId, postId, username) {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type: "save",
      content: "đã lưu bài viết của bạn",
      post: postId,
    });

    // Gửi thông báo realtime
    await notification.populate({
      path: "sender",
      select: "username name avatar",
    });

    // Gửi thông báo đã được populate đầy đủ thông tin
    await notification.populate({
      path: "post",
      select: "caption media",
    });

    // Tạo object thông báo đầy đủ thông tin để gửi qua socket
    const notificationPayload = {
      ...notification.toObject(),
      content: `${username || "Một người dùng"} đã lưu bài viết của bạn`,
    };

    return { notification, notificationPayload };
  }

  static async unsavePost(userId, postId) {
    const result = await SavePost.findOneAndDelete({
      user: userId,
      post: postId,
    });

    if (!result) {
      throw new Error("Bài viết chưa được lưu");
    }

    return result;
  }

  static async getSavedPosts(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const totalSavedPosts = await SavePost.countDocuments({ user: userId });

    const savedPosts = await SavePost.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "post",
        populate: {
          path: "user",
          select: "name profile.avatar",
        },
      });

    // Lọc ra những bài post không null
    const validPosts = savedPosts
      .map((sp) => sp.post)
      .filter((post) => post !== null);

    const { pagination } = getPaginationResponse({ data: validPosts, total: totalSavedPosts, page, limit });

    return {
      validPosts,
      pagination,
    };
  }

  static async checkSavedStatus(userId, postId) {
    const savedPost = await SavePost.findOne({
      user: userId,
      post: postId,
    });

    return !!savedPost;
  }

  // ======================================
  // Hashtag Methods (Merged from HashtagService)
  // ======================================
  static async findHashtagByName(name) {
    try {
      if (!name) {
        throw new Error("Hashtag name is required");
      }

      const hashtag = await Hashtags.findOne({ name });

      if (!hashtag) {
        logger.error(`No hashtag found with name: ${name}`);
        return null;
      }

      return hashtag;
    } catch (error) {
      logger.error("Database error in findHashtagByName:", error);
      throw new Error("Error finding hashtag");
    }
  }
}

export default PostService;
