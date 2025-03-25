import mongoose from "mongoose";
import Comment from "../models/mongodb/Comments.js";
import Post from "../models/mongodb/Posts.js";
import { io } from "../socket.js";

class CommentService {
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
          select: "name",
          populate: { path: "profile", select: "avatar" },
        })
        .lean();

      // Emit sự kiện "new_comment" qua socket
      io.to(`post:${postId}`).emit("new_comment", {
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
      console.error("Error in createComment:", error);
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
          select: "name",
          populate: { path: "profile", select: "avatar" },
        })
        .populate({
          path: "parentComment",
          populate: {
            path: "user",
            select: "name",
            populate: { path: "profile", select: "avatar" },
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
      console.error("Error in getCommentsByPostId:", error);
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
          select: "name",
          populate: { path: "profile", select: "avatar" },
        })
        .lean();

      // Lấy postId từ comment
      const postId = comment.post.toString();

      // Đếm số lượng comment của bài viết
      const commentCount = await Comment.countDocuments({ post: postId });

      // Emit sự kiện "update_comment" qua socket
      io.to(`post:${postId}`).emit("update_comment", {
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
      console.error("Error in updateComment:", error);
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
      io.to(`post:${postId}`).emit("delete_comment", {
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
      console.error("Error in deleteComment:", error);
      throw error;
    }
  }
}

export default CommentService;
