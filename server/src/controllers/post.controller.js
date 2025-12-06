import { CatchError } from "../configs/CatchError.js";
import PostService from "../services/Post.Service.js";
import { formatResponse } from "../helpers/formatResponse.js";
import { getPaginationParams } from "../helpers/pagination.js";
import SocketService from "../services/Socket.Service.js";
import logger from "../configs/logger.js";


const PostController = {
  GetAllPost: CatchError(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);
    const result = await PostService.getAllPosts(page, limit);
    return formatResponse(res, 200, 1, "Success", null, result);
  }),

  GetPostUserById: CatchError(async (req, res) => {
    const id = req.params.id;
    try {
      const postOfUser = await PostService.getPostsByUserId(id);
      return formatResponse(res, 200, 1, "Get posts of user successfully!", null, { postOfUser });
    } catch (error) {
      if (error.message === "User ID is required!") error.statusCode = 400;
      if (error.message === "No posts found for this user!") error.statusCode = 404;
      throw error;
    }
  }),

  DeletePost: CatchError(async (req, res) => {
    const { id } = req.params;
    try {
      await PostService.deletePost(id);
      return formatResponse(res, 200, 1, "Post deleted successfully");
    } catch (error) {
      if (error.message === "Post not found") error.statusCode = 404;
      throw error;
    }
  }),

  UpdatePost: CatchError(async (req, res) => {
    try {
      const post = await PostService.updatePost(req.params.id, req.body);
      return formatResponse(res, 200, 1, "Success", post);
    } catch (error) {
      if (error.message === "Post not found") error.statusCode = 404;
      throw error;
    }
  }),

  CreatePost: CatchError(async (req, res) => {
    try {
      const post = await PostService.createPost(req.user, req.body, req.files);
      return formatResponse(res, 201, 1, "Post created successfully", null, { post });
    } catch (error) {
      if (error.message === "Title là bắt buộc") error.statusCode = 400;
      logger.error(" Error creating post:", error);
      throw error;
    }
  }),

  // --- Methods from LikeController ---
  CreateLike: CatchError(async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;
    const currentUser = req.user;

    if (!postId) {
      const error = new Error("Post ID is required");
      error.statusCode = 400;
      throw error;
    }

    try {
      const { newLike, likeCount } = await PostService.likePost(userId, postId, currentUser);

      return formatResponse(res, 200, 1, "Liked successfully", {
        ...newLike.toObject(),
        likeCount,
      });
    } catch (error) {
      if (error.message.includes("Invalid ID format")) error.statusCode = 400;
      if (error.message === "You already liked this post") error.statusCode = 400; // Or 409
      throw error;
    }
  }),

  DeleteLike: CatchError(async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;

    if (!postId) {
      const error = new Error("Post ID is required");
      error.statusCode = 400;
      throw error;
    }

    try {
      const { likeCount } = await PostService.unlikePost(userId, postId);
      return formatResponse(res, 200, 1, "Unlike successful", null, { likeCount });
    } catch (error) {
      if (error.message === "You have not liked this post") error.statusCode = 400; 
      throw error;
    }
  }),

  GetLikeStatus: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      const error = new Error("Post ID is required");
      error.statusCode = 400;
      throw error;
    }

    const { isLiked, count } = await PostService.getLikeStatus(userId, postId);
    return formatResponse(res, 200, 1, "Success", null, { isLiked, count });
  }),

  GetAllLikeFromPosts: CatchError(async (req, res) => {
    const { postIds } = req.body;
    const userId = req.user.id;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      const error = new Error("Valid post IDs array is required");
      error.statusCode = 400;
      throw error;
    }

    const likeCounts = await PostService.getAllLikesFromPosts(postIds, userId);

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

    return formatResponse(res, 200, 1, "Success", formattedResults);
  }),

  ToggleLike: CatchError(async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;
    const currentUser = req.user;

    if (!postId) {
       const error = new Error("Post ID is required");
       error.statusCode = 400;
       throw error;
    }

    const { isLiked, count, message } = await PostService.toggleLikePost(userId, postId, currentUser);

    return formatResponse(res, 200, 1, message, null, {
      isLiked,
      count,
    });
  }),

  GetLikedPosts: CatchError(async (req, res) => {
    const userId = req.user.id;
    const likedPosts = await PostService.getLikedPosts(userId);

    const message = likedPosts.length === 0
          ? "No liked posts found"
          : "Liked posts retrieved successfully";

    return formatResponse(res, 200, 1, message, null, { posts: likedPosts });
  }),

  // --- Methods from CommentController ---
  createComment: CatchError(async (req, res) => {
    const { content, postId, parentComment } = req.body;
    const userId = req.user.id;

    try {
      const result = await PostService.createComment(
        userId,
        content,
        postId,
        parentComment
      );

      return formatResponse(res, 201, 1, "Đã tạo comment thành công", null, {
        comment: result.comment,
        commentCount: result.commentCount,
      });
    } catch (error) {
      if (error.message === "Nội dung comment không được để trống") error.statusCode = 400;
      if (error.message === "ID bài viết là bắt buộc") error.statusCode = 400;
      if (error.message === "Bài viết không tồn tại") error.statusCode = 404;
      throw error;
    }
  }),

  getCommentsByPost: CatchError(async (req, res) => {
    const { postId } = req.params;

    try {
      const result = await PostService.getCommentsByPostId(postId);

      return formatResponse(res, 200, 1, "Lấy comments thành công", null, {
        comments: result.comments,
        commentCount: result.commentCount,
      });
    } catch (error) {
      if (error.message === "ID bài viết là bắt buộc") error.statusCode = 400;
      if (error.message === "Bài viết không tồn tại") error.statusCode = 404;
      throw error;
    }
  }),

  updateComment: CatchError(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    try {
      const result = await PostService.updateComment(id, content, userId);

      return formatResponse(res, 200, 1, "Cập nhật comment thành công", null, {
        comment: result.comment,
      });
    } catch (error) {
      if (error.message === "Nội dung comment không được để trống") error.statusCode = 400;
      if (error.message === "Comment không tồn tại") error.statusCode = 404;
      if (error.message === "Bạn không có quyền cập nhật comment này") error.statusCode = 403;
      throw error;
    }
  }),

  deleteComment: CatchError(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const result = await PostService.deleteComment(id, userId);

      return formatResponse(res, 200, 1, "Xóa comment thành công", null, {
        commentId: result.commentId,
        commentCount: result.commentCount,
      });
    } catch (error) {
      if (error.message === "Comment không tồn tại") error.statusCode = 404;
      if (error.message === "Bạn không có quyền xóa comment này") error.statusCode = 403;
      throw error;
    }
  }),

  // --- Methods from SavePostController ---
  savePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      const error = new Error("Post ID is required");
      error.statusCode = 400;
      throw error;
    }

    const { post, savedPost } = await PostService.savePost(userId, postId);

    if (post.user.toString() !== userId) {
      const { notificationPayload } =
        await PostService.createSaveNotification(
          post.user,
          userId,
          postId,
          req.user.username
        );

      logger.info("Emitting save notification:", notificationPayload);
      SocketService.emitNotification(post.user.toString(), notificationPayload);
    }

    return formatResponse(res, 200, 1, "Đã lưu bài viết", null, { savedPost });
  }),

  unsavePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      const error = new Error("Post ID is required");
      error.statusCode = 400;
      throw error;
    }

    try {
      await PostService.unsavePost(userId, postId);
      return formatResponse(res, 200, 1, "Đã bỏ lưu bài viết");
    } catch (error) {
      if (error.message === "Bài viết chưa được lưu") error.statusCode = 404;
      throw error;
    }
  }),

  getSavedPosts: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page, limit } = getPaginationParams(req.query);

    const { validPosts, pagination } = await PostService.getSavedPosts(
      userId,
      page,
      limit
    );

    return formatResponse(res, 200, 1, "Success", null, {
      savedPosts: validPosts,
      pagination,
    });
  }),

  checkSavedStatus: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      const error = new Error("Post ID is required");
      error.statusCode = 400;
      throw error;
    }

    const isSaved = await PostService.checkSavedStatus(userId, postId);

    return formatResponse(res, 200, 1, "Success", null, { isSaved });
  }),
};

export default PostController;
