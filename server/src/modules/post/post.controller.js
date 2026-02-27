import { CatchError } from '../../configs/CatchError.js';
import PostService from './post.service.js';
import UserService from '../user/user.service.js';
import { sendCreated, sendOk } from '../../helpers/apiResponse.js';
import { getPaginationParams } from '../../utils/pagination.js';
import socketService from '../shared/socket/socket.service.js';
import logger from '../../configs/logger.js';
import ApiError from '../../helpers/ApiError.js';


/**
 * Post Controller
 * Handle all post-related requests
 *
 * Main features:
 * - Post CRUD (create, read, update, delete)
 * - Feed and discovery (home feed, explore, trending)
 * - Post and hashtag search
 * - Like/Unlike posts
 * - Save/unsave posts
 * - Comment system
 * - Share and report posts
 */
const PostController = {
  /**
   * Get home feed posts for current user
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of posts per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated home feed posts
   */
  GetAllPost: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = getPaginationParams(req.query);

    const result = await PostService.getHomeFeed(userId, { page, limit });
    return sendOk(res, {
      message: 'Success',
      data: result,
    });

  }),

  /**
   * Get explore feed posts
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of posts per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated explore feed posts
   */
  GetExploreFeed: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = getPaginationParams(req.query);

    const result = await PostService.getExploreFeed(userId, { page, limit });
    return sendOk(res, {
      message: 'Success',
      data: result,
    });

  }),

  /**
   * Get hashtag feed posts (posts containing hashtags)
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of posts per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated hashtag feed posts
   */
  GetHashtagFeed: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = getPaginationParams(req.query);

    const result = await PostService.getHashtagFeed(userId, { page, limit });
    return sendOk(res, {
      message: 'Success',
      data: result,
    });

  }),

  /**
   * Get personalized feed based on user preferences
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of posts per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated personalized feed posts
   */
  GetPersonalizedFeed: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = getPaginationParams(req.query);

    const result = await PostService.getPersonalizedFeed(userId, {
      page,
      limit,
    });
    return sendOk(res, {
      message: 'Success',
      data: result,
    });

  }),

  /**
   * Get trending posts by timeframe
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of posts per page
   * @param {string} [req.query.timeframe='day'] - Timeframe for trending (day/week/month)
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated trending posts
   */
  GetTrendingPosts: CatchError(async (req, res) => {
    const { page = 1, limit = 20, timeframe = 'day' } = req.query;

    const result = await PostService.getTrendingPosts({
      page: parseInt(page),
      limit: parseInt(limit),
      timeframe,
    });
    return sendOk(res, {
      message: 'Success',
      data: result,
    });

  }),

  /**
   * Get single post by ID
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.id - Post ID to retrieve
   * @param {Object} [req.user] - Authenticated user object (optional)
   * @param {string} [req.user.id] - Current user's ID for context
   * @param {Object} res - Express response object
   * @returns {Object} Response with post data
   */
  GetPostById: CatchError(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const post = await PostService.getPostById(id, userId);
    return sendOk(res, {
      message: 'Success',
      data: post,
    });

  }),

  /**
   * Get posts by user ID or username
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.id - User ID or username
   * @param {Object} [req.user] - Authenticated user object (optional)
   * @param {string} [req.user.id] - Current user's ID for context
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of posts per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated user posts
   */
  GetPostUserById: CatchError(async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user?.id;
    const { page = 1, limit = 20 } = getPaginationParams(req.query);

    const resolvedUserId = await UserService.resolveUserIdOrUsername(id);
    if (!resolvedUserId) {
      throw ApiError.notFound('Người dùng không tồn tại');
    }

    const result = await PostService.getUserPosts(resolvedUserId, requesterId, {
      page,
      limit,
    });
    return sendOk(res, {
      message: 'Get posts of user successfully!',
      data: result,
    });

  }),

  /**
   * Create new post with optional media
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} [req.body.caption] - Post caption/content
   * @param {string} [req.body.visibility='public'] - Post visibility (public/private/followers)
   * @param {string} [req.body.location] - Post location
   * @param {Array} [req.body.mentions] - Array of mentioned user IDs
   * @param {Array} [req.files] - Uploaded media files
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with created post data
   */
  CreatePost: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { caption, visibility = 'public', location, mentions } = req.body;

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

    return sendCreated(res, {
      message: 'Post created successfully',
      data: post,
    });

  }),

  /**
   * Update existing post
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.id - Post ID to update
   * @param {Object} req.body - Request body with update data
   * @param {string} [req.body.caption] - Updated caption
   * @param {string} [req.body.visibility] - Updated visibility
   * @param {string} [req.body.location] - Updated location
   * @param {Array} [req.files] - New media files to add
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated post data
   */
  UpdatePost: CatchError(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    let media = [];
    if (req.files && req.files.length > 0) {
      media = await PostService.uploadMedia(req.files, userId);
      req.body.media = media;
    }

    const post = await PostService.updatePost(id, userId, req.body);
    return sendOk(res, {
      message: 'Post updated successfully',
      data: post,
    });

  }),

  /**
   * Delete a post
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.id - Post ID to delete
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {boolean} [req.user.isAdmin] - Whether user is admin
   * @param {Object} res - Express response object
   * @returns {Object} Response with delete success message
   */
  DeletePost: CatchError(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    await PostService.deletePost(id, userId, isAdmin);
    return sendOk(res, {
      message: 'Post deleted successfully',
    });

  }),

  /**
   * Search posts by query string
   * @param {Object} req - Express request object
   * @param {Object} [req.user] - Authenticated user object (optional)
   * @param {string} [req.user.id] - Current user's ID for context
   * @param {Object} req.query - Query parameters
   * @param {string} [req.query.q] - Search query string
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of results per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated search results
   */
  SearchPosts: CatchError(async (req, res) => {
    const userId = req.user?.id;
    const { q: searchQuery, page = 1, limit = 20 } = req.query;

    if (!searchQuery || searchQuery.trim().length < 2) {
      throw ApiError.badRequest('Query must be at least 2 characters');
    }

    const result = await PostService.searchPosts(searchQuery, userId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return sendOk(res, {
      message: 'Success',
      data: result,
    });

  }),

  /**
   * Get posts by hashtag
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.hashtag - Hashtag to search for (without #)
   * @param {Object} [req.user] - Authenticated user object (optional)
   * @param {string} [req.user.id] - Current user's ID for context
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of posts per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated posts containing hashtag
   */
  GetPostsByHashtag: CatchError(async (req, res) => {
    const { hashtag } = req.params;
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await PostService.getPostsByHashtag(hashtag, userId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return sendOk(res, {
      message: 'Success',
      data: result,
    });

  }),

  /**
   * Get trending hashtags
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.limit=10] - Maximum number of hashtags to return
   * @param {Object} res - Express response object
   * @returns {Object} Response with list of trending hashtags
   */
  GetTrendingHashtags: CatchError(async (req, res) => {
    const { limit = 10 } = req.query;

    const hashtags = await PostService.getTrendingHashtags(parseInt(limit));
    return sendOk(res, {
      message: 'Success',
      data: hashtags,
    });

  }),

  /**
   * Like a post
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.postId - Post ID to like
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {string} req.user.username - Current user's username
   * @param {Object} res - Express response object
   * @returns {Object} Response with like result and updated like count
   */
  CreateLike: CatchError(async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;

    if (!postId) {
      throw ApiError.badRequest('Post ID is required');
    }


    const result = await PostService.likePost(postId, userId);

    if (!result.alreadyLiked) {
      const post = await PostService.getPostById(postId);
      if (post.user && post.user._id.toString() !== userId) {
        socketService.emitPostLike(post.user._id.toString(), {
          postId,
          userId,
          username: req.user.username,
        });
      }
    }

    return sendOk(res, {
      message: 'Liked successfully',
      data: result,
    });

  }),

  /**
   * Unlike a post
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.postId - Post ID to unlike
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with unlike result and updated like count
   */
  DeleteLike: CatchError(async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;

    if (!postId) {
      throw ApiError.badRequest('Post ID is required');
    }


    const result = await PostService.unlikePost(postId, userId);
    return sendOk(res, {
      message: 'Unliked successfully',
      data: result,
    });

  }),

  /**
   * Get like status for a post
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.postId - Post ID to check like status
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with isLiked boolean and like count
   */
  GetLikeStatus: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      throw ApiError.badRequest('Post ID is required');
    }


    const post = await PostService.getPostById(postId, userId);
    return sendOk(res, {
      message: 'Success',
      data: {
        isLiked: post.isLiked,
        count: post.likesCount,
      },
    });

  }),

  /**
   * Toggle like status on a post
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.postId - Post ID to toggle like
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with toggle result (liked: true/false) and updated count
   */
  ToggleLike: CatchError(async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;

    if (!postId) {
      throw ApiError.badRequest('Post ID is required');
    }


    const result = await PostService.toggleLike(postId, userId);

    const message = result.liked
      ? 'Liked successfully'
      : 'Unliked successfully';
    return sendOk(res, {
      message,
      data: result,
    });

  }),

  /**
   * Get users who liked a post
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.postId - Post ID to get likes for
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=50] - Number of users per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated list of users who liked the post
   */
  GetPostLikes: CatchError(async (req, res) => {
    const { postId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const users = await PostService.getPostLikes(postId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return sendOk(res, {
      message: 'Success',
      data: users,
    });

  }),

  /**
   * Get posts liked by current user
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of posts per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated liked posts
   */
  GetLikedPosts: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await PostService.getLikedPosts(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return sendOk(res, {
      message: 'Success',
      data: result,
    });

  }),

  /**
   * Get shared posts by user
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.id - User ID to get shared posts for
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of posts per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated shared posts
   */
  GetSharedPosts: CatchError(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await PostService.getSharedPosts(id, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return sendOk(res, {
      message: 'Success',
      data: result,
    });

  }),

  /**
   * Get like status for multiple posts
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {Array<string>} req.body.postIds - Array of post IDs to check
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with object mapping postId to {count, isLiked}
   */
  GetAllLikeFromPosts: CatchError(async (req, res) => {
    const { postIds } = req.body;
    const userId = req.user.id;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      throw ApiError.badRequest('Valid post IDs array is required');
    }


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

    return sendOk(res, {
      message: 'Success',
      data: results,
    });

  }),

  /**
   * Save a post to collection
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.postId - Post ID to save
   * @param {Object} req.body - Request body
   * @param {string} [req.body.collection] - Collection name to save to
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with save result
   */
  savePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;
    const { collection } = req.body;

    if (!postId) {
      throw ApiError.badRequest('Post ID is required');
    }


    const result = await PostService.savePost(postId, userId, collection);
    return sendOk(res, {
      message: 'Đã lưu bài viết',
      data: result,
    });

  }),

  /**
   * Unsave a post
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.postId - Post ID to unsave
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with unsave success message
   */
  unsavePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      throw ApiError.badRequest('Post ID is required');
    }


    await PostService.unsavePost(postId, userId);
    return sendOk(res, {
      message: 'Đã bỏ lưu bài viết',
    });

  }),

  /**
   * Get saved posts for current user
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of posts per page
   * @param {string} [req.query.collection] - Filter by collection name
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated saved posts
   */
  getSavedPosts: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, collection } = req.query;

    const result = await PostService.getSavedPosts(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      collection,
    });
    return sendOk(res, {
      message: 'Success',
      data: result,
    });

  }),

  /**
   * Get saved post collections for current user
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with list of saved collections
   */
  getSavedCollections: CatchError(async (req, res) => {
    const userId = req.user.id;

    const collections = await PostService.getSavedCollections(userId);
    return sendOk(res, {
      message: 'Success',
      data: collections,
    });

  }),

  /**
   * Check if post is saved by current user
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.postId - Post ID to check
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with isSaved boolean
   */
  checkSavedStatus: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      throw ApiError.badRequest('Post ID is required');
    }


    const post = await PostService.getPostById(postId, userId);
    return sendOk(res, {
      message: 'Success',
      data: {
        isSaved: post.isSaved || false,
      },
    });

  }),

  /**
   * Create a comment on a post
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.content - Comment content
   * @param {string} req.body.postId - Post ID to comment on
   * @param {string} [req.body.parentId] - Parent comment ID for replies
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {string} req.user.username - Current user's username
   * @param {Object} res - Express response object
   * @returns {Object} Response with created comment data
   */
  createComment: CatchError(async (req, res) => {
    const { content, postId, parentId } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      throw ApiError.badRequest('Nội dung comment không được để trống');
    }

    if (!postId) {
      throw ApiError.badRequest('ID bài viết là bắt buộc');
    }


    const comment = await PostService.addComment(
      postId,
      userId,
      content,
      parentId
    );

    const post = await PostService.getPostById(postId);

    socketService.emitToRoom(`post:${postId}`, 'new_comment', {
      postId,
      comment,
      timestamp: new Date(),
    });

    if (post.user && post.user._id.toString() !== userId) {
      socketService.emitPostComment(post.user._id.toString(), {
        postId,
        commentId: comment._id,
        userId,
        username: req.user.username,
        content: content.substring(0, 50),
      });
    }

    return sendCreated(res, {
      message: 'Đã tạo comment thành công',
      data: comment,
    });

  }),

  /**
   * Get comments for a post
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.postId - Post ID to get comments for
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of comments per page
   * @param {string} [req.query.sort='best'] - Sort order (best/newest/oldest)
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated comments
   */
  getCommentsByPost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const { page = 1, limit = 20, sort = 'best' } = req.query;

    if (!postId) {
      throw ApiError.badRequest('ID bài viết là bắt buộc');
    }

    const result = await PostService.getComments(postId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
    });
    return sendOk(res, {
      message: 'Lấy comments thành công',
      data: result,
    });

  }),

  /**
   * Get replies for a comment
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.commentId - Comment ID to get replies for
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=10] - Number of replies per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated comment replies
   */
  getCommentReplies: CatchError(async (req, res) => {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await PostService.getCommentReplies(commentId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return sendOk(res, {
      message: 'Success',
      data: result,
    });

  }),

  /**
   * Update a comment
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.id - Comment ID to update
   * @param {Object} req.body - Request body
   * @param {string} req.body.content - Updated comment content
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated comment data
   */
  updateComment: CatchError(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      throw ApiError.badRequest('Nội dung comment không được để trống');
    }

    const comment = await PostService.updateComment(id, userId, content);
    return sendOk(res, {
      message: 'Cập nhật comment thành công',
      data: comment,
    });
  }),

  /**
   * Delete a comment
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.id - Comment ID to delete
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {boolean} [req.user.isAdmin] - Whether user is admin
   * @param {Object} res - Express response object
   * @returns {Object} Response with delete success message
   */
  deleteComment: CatchError(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    await PostService.deleteComment(id, userId, isAdmin);
    return sendOk(res, {
      message: 'Xóa comment thành công',
    });
  }),

  /**
   * Like a comment
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.commentId - Comment ID to like
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with like result
   */
  likeComment: CatchError(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    const result = await PostService.likeComment(commentId, userId);
    return sendOk(res, {
      message: 'Liked comment',
      data: result,
    });
  }),

  /**
   * Unlike a comment
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.commentId - Comment ID to unlike
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with unlike result
   */
  unlikeComment: CatchError(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    const result = await PostService.unlikeComment(commentId, userId);
    return sendOk(res, {
      message: 'Unliked comment',
      data: result,
    });
  }),

  /**
   * Share a post
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.postId - Post ID to share
   * @param {Object} req.body - Request body
   * @param {string} [req.body.platform='internal'] - Share platform (internal/twitter/facebook)
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with share result
   */
  sharePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;
    const { platform = 'internal' } = req.body;

    const result = await PostService.sharePost(postId, userId, platform);
    return sendOk(res, {
      message: 'Shared successfully',
      data: result,
    });
  }),

  /**
   * Report a post for violation
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.postId - Post ID to report
   * @param {Object} req.body - Request body
   * @param {string} req.body.reason - Report reason/category
   * @param {string} [req.body.description] - Additional description
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with report submission result
   */
  reportPost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;
    const { reason, description } = req.body;

    if (!reason) {
      throw ApiError.badRequest('Lý do báo cáo là bắt buộc');
    }

    const report = await PostService.reportPost(
      postId,
      userId,
      reason,
      description
    );
    return sendOk(res, {
      message: 'Báo cáo đã được gửi',
      data: report,
    });
  }),
};

export default PostController;
