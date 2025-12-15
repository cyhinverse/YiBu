import { CatchError } from "../configs/CatchError.js";
import PostService from "../services/Post.Service.js";
import { formatResponse } from "../helpers/formatResponse.js";
import { getPaginationParams } from "../helpers/pagination.js";
import socketService from "../services/Socket.Service.js";
import logger from "../configs/logger.js";

const PostController = {
  // ======================================
  // Post CRUD
  // ======================================

  GetAllPost: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = getPaginationParams(req.query);

    const result = await PostService.getHomeFeed(userId, { page, limit });
    return formatResponse(res, 200, 1, "Success", result);
  }),

  GetExploreFeed: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = getPaginationParams(req.query);

    const result = await PostService.getExploreFeed(userId, { page, limit });
    return formatResponse(res, 200, 1, "Success", result);
  }),

  GetPersonalizedFeed: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = getPaginationParams(req.query);

    const result = await PostService.getPersonalizedFeed(userId, {
      page,
      limit,
    });
    return formatResponse(res, 200, 1, "Success", result);
  }),

  GetTrendingPosts: CatchError(async (req, res) => {
    const { page = 1, limit = 20, timeframe = "day" } = req.query;

    const result = await PostService.getTrendingPosts({
      page: parseInt(page),
      limit: parseInt(limit),
      timeframe,
    });
    return formatResponse(res, 200, 1, "Success", result);
  }),

  GetPostById: CatchError(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const post = await PostService.getPostById(id, userId);
    return formatResponse(res, 200, 1, "Success", post);
  }),

  GetPostUserById: CatchError(async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user?.id;
    const { page = 1, limit = 20 } = getPaginationParams(req.query);

    const result = await PostService.getUserPosts(id, requesterId, {
      page,
      limit,
    });
    return formatResponse(
      res,
      200,
      1,
      "Get posts of user successfully!",
      result
    );
  }),

  CreatePost: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { caption, visibility = "public", location, mentions } = req.body;

    let media = [];
    if (req.files && req.files.length > 0) {
      media = await PostService.uploadMedia(req.files, userId);
    }

    const post = await PostService.createPost(
      {
        caption,
        media,
        visibility,
        location,
        mentions,
      },
      userId
    );

    return formatResponse(res, 201, 1, "Post created successfully", post);
  }),

  UpdatePost: CatchError(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    let media = [];
    if (req.files && req.files.length > 0) {
      media = await PostService.uploadMedia(req.files, userId);
      req.body.media = media;
    }

    const post = await PostService.updatePost(id, userId, req.body);
    return formatResponse(res, 200, 1, "Post updated successfully", post);
  }),

  DeletePost: CatchError(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    await PostService.deletePost(id, userId, isAdmin);
    return formatResponse(res, 200, 1, "Post deleted successfully");
  }),

  // ======================================
  // Search
  // ======================================

  SearchPosts: CatchError(async (req, res) => {
    const userId = req.user?.id;
    const { query, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return formatResponse(res, 400, 0, "Query must be at least 2 characters");
    }

    const result = await PostService.searchPosts(query, userId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return formatResponse(res, 200, 1, "Success", result);
  }),

  GetPostsByHashtag: CatchError(async (req, res) => {
    const { hashtag } = req.params;
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await PostService.getPostsByHashtag(hashtag, userId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return formatResponse(res, 200, 1, "Success", result);
  }),

  GetTrendingHashtags: CatchError(async (req, res) => {
    const { limit = 10 } = req.query;

    const hashtags = await PostService.getTrendingHashtags(parseInt(limit));
    return formatResponse(res, 200, 1, "Success", hashtags);
  }),

  // ======================================
  // Like System
  // ======================================

  CreateLike: CatchError(async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;

    if (!postId) {
      return formatResponse(res, 400, 0, "Post ID is required");
    }

    const result = await PostService.likePost(postId, userId);

    if (!result.alreadyLiked) {
      const post = await PostService.getPostById(postId);
      if (post.user._id.toString() !== userId) {
        socketService.emitPostLike(post.user._id.toString(), {
          postId,
          userId,
          username: req.user.username,
        });
      }
    }

    return formatResponse(res, 200, 1, "Liked successfully", result);
  }),

  DeleteLike: CatchError(async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;

    if (!postId) {
      return formatResponse(res, 400, 0, "Post ID is required");
    }

    const result = await PostService.unlikePost(postId, userId);
    return formatResponse(res, 200, 1, "Unliked successfully", result);
  }),

  GetLikeStatus: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      return formatResponse(res, 400, 0, "Post ID is required");
    }

    const post = await PostService.getPostById(postId, userId);
    return formatResponse(res, 200, 1, "Success", {
      isLiked: post.isLiked,
      count: post.likesCount,
    });
  }),

  ToggleLike: CatchError(async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;

    if (!postId) {
      return formatResponse(res, 400, 0, "Post ID is required");
    }

    const result = await PostService.toggleLike(postId, userId);

    const message = result.liked
      ? "Liked successfully"
      : "Unliked successfully";
    return formatResponse(res, 200, 1, message, result);
  }),

  GetPostLikes: CatchError(async (req, res) => {
    const { postId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const users = await PostService.getPostLikes(postId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return formatResponse(res, 200, 1, "Success", users);
  }),

  GetLikedPosts: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    // This would need to be implemented in PostService if needed
    return formatResponse(res, 200, 1, "Feature coming soon", []);
  }),

  GetAllLikeFromPosts: CatchError(async (req, res) => {
    const { postIds } = req.body;
    const userId = req.user.id;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return formatResponse(res, 400, 0, "Valid post IDs array is required");
    }

    // Batch get like status for multiple posts
    const results = {};
    for (const postId of postIds) {
      try {
        const post = await PostService.getPostById(postId, userId);
        results[postId] = {
          count: post.likesCount || 0,
          isLiked: post.isLiked || false,
        };
      } catch (error) {
        results[postId] = { count: 0, isLiked: false };
      }
    }

    return formatResponse(res, 200, 1, "Success", results);
  }),

  // ======================================
  // Save System
  // ======================================

  savePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;
    const { collection } = req.body;

    if (!postId) {
      return formatResponse(res, 400, 0, "Post ID is required");
    }

    const result = await PostService.savePost(postId, userId, collection);
    return formatResponse(res, 200, 1, "Đã lưu bài viết", result);
  }),

  unsavePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      return formatResponse(res, 400, 0, "Post ID is required");
    }

    await PostService.unsavePost(postId, userId);
    return formatResponse(res, 200, 1, "Đã bỏ lưu bài viết");
  }),

  getSavedPosts: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, collection } = req.query;

    const result = await PostService.getSavedPosts(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      collection,
    });
    return formatResponse(res, 200, 1, "Success", result);
  }),

  getSavedCollections: CatchError(async (req, res) => {
    const userId = req.user.id;

    const collections = await PostService.getSavedCollections(userId);
    return formatResponse(res, 200, 1, "Success", collections);
  }),

  checkSavedStatus: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      return formatResponse(res, 400, 0, "Post ID is required");
    }

    const post = await PostService.getPostById(postId, userId);
    return formatResponse(res, 200, 1, "Success", {
      isSaved: post.isSaved || false,
    });
  }),

  // ======================================
  // Comment System
  // ======================================

  createComment: CatchError(async (req, res) => {
    const { content, postId, parentComment } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return formatResponse(
        res,
        400,
        0,
        "Nội dung comment không được để trống"
      );
    }

    if (!postId) {
      return formatResponse(res, 400, 0, "ID bài viết là bắt buộc");
    }

    const comment = await PostService.addComment(
      postId,
      userId,
      content,
      parentComment
    );

    // Emit socket event
    const post = await PostService.getPostById(postId);
    if (post.user._id.toString() !== userId) {
      socketService.emitPostComment(post.user._id.toString(), {
        postId,
        commentId: comment._id,
        userId,
        username: req.user.username,
        content: content.substring(0, 50),
      });
    }

    return formatResponse(res, 201, 1, "Đã tạo comment thành công", comment);
  }),

  getCommentsByPost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const { page = 1, limit = 20, sort = "best" } = req.query;

    if (!postId) {
      return formatResponse(res, 400, 0, "ID bài viết là bắt buộc");
    }

    const result = await PostService.getComments(postId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
    });
    return formatResponse(res, 200, 1, "Lấy comments thành công", result);
  }),

  getCommentReplies: CatchError(async (req, res) => {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await PostService.getCommentReplies(commentId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return formatResponse(res, 200, 1, "Success", result);
  }),

  updateComment: CatchError(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return formatResponse(
        res,
        400,
        0,
        "Nội dung comment không được để trống"
      );
    }

    // Note: updateComment not implemented in new PostService
    // Would need to add this method
    return formatResponse(res, 200, 1, "Feature coming soon");
  }),

  deleteComment: CatchError(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    await PostService.deleteComment(id, userId, isAdmin);
    return formatResponse(res, 200, 1, "Xóa comment thành công");
  }),

  likeComment: CatchError(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    const result = await PostService.likeComment(commentId, userId);
    return formatResponse(res, 200, 1, "Liked comment", result);
  }),

  unlikeComment: CatchError(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    const result = await PostService.unlikeComment(commentId, userId);
    return formatResponse(res, 200, 1, "Unliked comment", result);
  }),

  // ======================================
  // Share
  // ======================================

  sharePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;
    const { platform = "internal" } = req.body;

    const result = await PostService.sharePost(postId, userId, platform);
    return formatResponse(res, 200, 1, "Shared successfully", result);
  }),

  // ======================================
  // Report
  // ======================================

  reportPost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;
    const { reason, description } = req.body;

    if (!reason) {
      return formatResponse(res, 400, 0, "Lý do báo cáo là bắt buộc");
    }

    const report = await PostService.reportPost(
      postId,
      userId,
      reason,
      description
    );
    return formatResponse(res, 200, 1, "Báo cáo đã được gửi", report);
  }),
};

export default PostController;
