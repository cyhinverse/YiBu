import mongoose from "mongoose";
import Likes from "../models/mongodb/Likes.js";
import Post from "../models/mongodb/Posts.js";
import Notification from "../models/mongodb/Notifications.js";
import { io } from "../socket.js";

class LikeService {
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
        select: "name avatar",
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
}

export default LikeService;
