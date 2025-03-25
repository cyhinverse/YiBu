import mongoose from "mongoose";
import { CatchError } from "../../configs/CatchError.js";
import Comment from "../../models/mongodb/Comments.js";
import Post from "../../models/mongodb/Posts.js";
import User from "../../models/mongodb/Users.js";
import { io } from "../../socket.js";
import CommentService from "../../services/Comment.service.js";

const CommentController = {
  // Tạo comment mới
  createComment: CatchError(async (req, res) => {
    const { content, postId, parentComment } = req.body;
    const userId = req.user.id;

    try {
      const result = await CommentService.createComment(
        userId,
        content,
        postId,
        parentComment
      );

      return res.status(201).json({
        code: 1,
        message: "Đã tạo comment thành công",
        comment: result.comment,
        commentCount: result.commentCount,
      });
    } catch (error) {
      if (error.message === "Nội dung comment không được để trống") {
        return res.status(400).json({
          code: 0,
          message: error.message,
        });
      } else if (error.message === "ID bài viết là bắt buộc") {
        return res.status(400).json({
          code: 0,
          message: error.message,
        });
      } else if (error.message === "Bài viết không tồn tại") {
        return res.status(404).json({
          code: 0,
          message: error.message,
        });
      }
      throw error;
    }
  }, "Tạo comment thất bại"),

  // Lấy tất cả comments cho một bài viết
  getCommentsByPost: CatchError(async (req, res) => {
    const { postId } = req.params;

    try {
      const result = await CommentService.getCommentsByPostId(postId);

      return res.status(200).json({
        code: 1,
        message: "Lấy comments thành công",
        comments: result.comments,
        commentCount: result.commentCount,
      });
    } catch (error) {
      if (error.message === "ID bài viết là bắt buộc") {
        return res.status(400).json({
          code: 0,
          message: error.message,
        });
      } else if (error.message === "Bài viết không tồn tại") {
        return res.status(404).json({
          code: 0,
          message: error.message,
        });
      }
      throw error;
    }
  }, "Lấy comments thất bại"),

  // Cập nhật comment
  updateComment: CatchError(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    try {
      const result = await CommentService.updateComment(id, content, userId);

      return res.status(200).json({
        code: 1,
        message: "Cập nhật comment thành công",
        comment: result.comment,
      });
    } catch (error) {
      if (error.message === "Nội dung comment không được để trống") {
        return res.status(400).json({
          code: 0,
          message: error.message,
        });
      } else if (error.message === "Comment không tồn tại") {
        return res.status(404).json({
          code: 0,
          message: error.message,
        });
      } else if (error.message === "Bạn không có quyền cập nhật comment này") {
        return res.status(403).json({
          code: 0,
          message: error.message,
        });
      }
      throw error;
    }
  }, "Cập nhật comment thất bại"),

  // Xóa comment
  deleteComment: CatchError(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const result = await CommentService.deleteComment(id, userId);

      return res.status(200).json({
        code: 1,
        message: "Xóa comment thành công",
        commentId: result.commentId,
        commentCount: result.commentCount,
      });
    } catch (error) {
      if (error.message === "Comment không tồn tại") {
        return res.status(404).json({
          code: 0,
          message: error.message,
        });
      } else if (error.message === "Bạn không có quyền xóa comment này") {
        return res.status(403).json({
          code: 0,
          message: error.message,
        });
      }
      throw error;
    }
  }, "Xóa comment thất bại"),
};

export default CommentController;
