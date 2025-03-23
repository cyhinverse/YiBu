import mongoose from "mongoose";
import { CatchError } from "../../configs/CatchError.js";
import Comment from "../../models/mongodb/Comments.js";
import Post from "../../models/mongodb/Posts.js";
import User from "../../models/mongodb/Users.js";
import { io } from "../../socket.js";

const CommentController = {
  // Tạo comment mới
  createComment: CatchError(async (req, res) => {
    const { content, postId, parentComment } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        code: 0,
        message: "Nội dung comment không được để trống",
      });
    }

    if (!postId) {
      return res.status(400).json({
        code: 0,
        message: "ID bài viết là bắt buộc",
      });
    }

    // Kiểm tra xem bài viết có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        code: 0,
        message: "Bài viết không tồn tại",
      });
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

    return res.status(201).json({
      code: 1,
      message: "Đã tạo comment thành công",
      comment: populatedComment,
      commentCount,
    });
  }, "Tạo comment thất bại"),

  // Lấy tất cả comments cho một bài viết
  getCommentsByPost: CatchError(async (req, res) => {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({
        code: 0,
        message: "ID bài viết là bắt buộc",
      });
    }

    // Kiểm tra xem bài viết có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        code: 0,
        message: "Bài viết không tồn tại",
      });
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

    return res.status(200).json({
      code: 1,
      message: "Lấy comments thành công",
      comments: commentTree,
      commentCount,
    });
  }, "Lấy comments thất bại"),

  // Cập nhật comment
  updateComment: CatchError(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        code: 0,
        message: "Nội dung comment không được để trống",
      });
    }

    // Tìm comment cần cập nhật
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        code: 0,
        message: "Comment không tồn tại",
      });
    }

    // Kiểm tra xem người dùng có quyền cập nhật comment không
    if (comment.user.toString() !== userId) {
      return res.status(403).json({
        code: 0,
        message: "Bạn không có quyền cập nhật comment này",
      });
    }

    // Cập nhật comment
    comment.content = content;
    await comment.save();

    const updatedComment = await Comment.findById(id)
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

    return res.status(200).json({
      code: 1,
      message: "Cập nhật comment thành công",
      comment: updatedComment,
    });
  }, "Cập nhật comment thất bại"),

  // Xóa comment
  deleteComment: CatchError(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Tìm comment cần xóa
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        code: 0,
        message: "Comment không tồn tại",
      });
    }

    // Kiểm tra xem người dùng có quyền xóa comment không
    if (comment.user.toString() !== userId) {
      return res.status(403).json({
        code: 0,
        message: "Bạn không có quyền xóa comment này",
      });
    }

    // Lưu postId trước khi xóa comment
    const postId = comment.post.toString();

    // Xóa tất cả reply của comment này
    await Comment.deleteMany({ parentComment: comment._id });

    // Xóa comment
    await Comment.findByIdAndDelete(id);

    // Đếm số lượng comment còn lại của bài viết
    const commentCount = await Comment.countDocuments({ post: postId });

    // Emit sự kiện "delete_comment" qua socket
    io.to(`post:${postId}`).emit("delete_comment", {
      commentId: id,
      postId,
      commentCount,
      action: "delete",
    });

    return res.status(200).json({
      code: 1,
      message: "Xóa comment thành công",
      commentCount,
    });
  }, "Xóa comment thất bại"),
};

export default CommentController;
