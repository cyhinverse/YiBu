import Joi from 'joi';
import { objectId } from './common.validation.js';

/**
 * Post Validation Schemas
 * Validation cho tất cả endpoints trong post.router.js
 */

// ======================================
// GET / (GetAllPost)
// Query: { page?, limit?, sort? }
// ======================================
export const getAllPostsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sort: Joi.string().valid('newest', 'oldest', 'popular').default('newest'),
});

// ======================================
// GET /explore
// Query: { page?, limit?, category? }
// ======================================
export const exploreQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  category: Joi.string().max(50),
});

// ======================================
// GET /personalized
// Query: { page?, limit? }
// ======================================
export const personalizedQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

// ======================================
// GET /trending
// Query: { limit?, timeframe? }
// ======================================
export const trendingQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(20),
  timeframe: Joi.string().valid('day', 'week', 'month').default('day'),
});

// ======================================
// GET /search
// Query: { q, page?, limit?, sort? }
// ======================================
export const searchPostsQuery = Joi.object({
  q: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Từ khóa tìm kiếm không được để trống',
    'any.required': 'Từ khóa tìm kiếm là bắt buộc',
  }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sort: Joi.string().valid('newest', 'oldest', 'popular').default('newest'),
  type: Joi.string().valid('all', 'image', 'video', 'text'),
});

// ======================================
// GET /hashtag/:hashtag
// Params: { hashtag }
// Query: { page?, limit? }
// ======================================
export const hashtagParam = Joi.object({
  hashtag: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': 'Hashtag không được để trống',
    'any.required': 'Hashtag là bắt buộc',
  }),
});

export const hashtagQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

// ======================================
// GET /hashtags/trending
// Query: { limit? }
// ======================================
export const trendingHashtagsQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(30).default(10),
});

// ======================================
// POST / (CreatePost)
// Body: { caption, visibility?, hashtags?, location? }
// Note: files được xử lý bởi multer
// ======================================
export const createPostBody = Joi.object({
  caption: Joi.string().trim().max(5000).allow('').default('').messages({
    'string.max': 'Nội dung không được quá 5000 ký tự',
  }),
  visibility: Joi.string()
    .valid('public', 'followers', 'private')
    .default('public'),
  hashtags: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim().max(50)).max(10),
    Joi.string() // Cho phép string JSON
  ),
  location: Joi.string().trim().max(100).allow(''),
  mentions: Joi.alternatives().try(
    Joi.array().items(Joi.string()).max(20),
    Joi.string() // Cho phép string JSON
  ),
  allowComments: Joi.boolean().default(true),
  allowSharing: Joi.boolean().default(true),
});

// ======================================
// GET /user/:id (GetPostUserById)
// Params: { id }
// Query: { page?, limit? }
// ======================================
export const userPostsParam = Joi.object({
  id: objectId.required(),
});

export const userPostsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

// ======================================
// GET /:id (GetPostById)
// Params: { id }
// ======================================
export const postIdParam = Joi.object({
  id: objectId.required(),
});

// ======================================
// PUT /:id (UpdatePost)
// Params: { id }
// Body: { content?, visibility?, hashtags? }
// ======================================
export const updatePostBody = Joi.object({
  caption: Joi.string().trim().min(0).max(5000).allow('').messages({
    'string.max': 'Nội dung không được quá 5000 ký tự',
  }),
  visibility: Joi.string().valid('public', 'followers', 'private'),
  hashtags: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim().max(50)).max(10),
    Joi.string()
  ),
  mentions: Joi.alternatives().try(
    Joi.array().items(Joi.string()).max(20),
    Joi.string()
  ),
  location: Joi.string().trim().max(100).allow(''),
  existingMedia: Joi.alternatives().try(Joi.string(), Joi.array()),
  allowComments: Joi.boolean(),
  allowSharing: Joi.boolean(),
});

// ======================================
// DELETE /:id (DeletePost)
// Params: { id }
// ======================================
export const deletePostParam = Joi.object({
  id: objectId.required(),
});

// ======================================
// POST /:postId/share (sharePost)
// Params: { postId }
// Body: { message?, visibility? }
// ======================================
export const sharePostParam = Joi.object({
  postId: objectId.required(),
});

export const sharePostBody = Joi.object({
  message: Joi.string().trim().max(1000).allow(''),
  visibility: Joi.string()
    .valid('public', 'followers', 'private')
    .default('public'),
});

// ======================================
// POST /:postId/report (reportPost)
// Params: { postId }
// Body: { reason, description? }
// ======================================
export const reportPostParam = Joi.object({
  postId: objectId.required(),
});

export const reportPostBody = Joi.object({
  reason: Joi.string()
    .valid('spam', 'harassment', 'violence', 'hate_speech', 'nudity', 'other')
    .required()
    .messages({
      'any.only': 'Lý do báo cáo không hợp lệ',
      'any.required': 'Lý do báo cáo là bắt buộc',
    }),
  description: Joi.string().trim().max(500).allow(''),
});

export default {
  getAllPostsQuery,
  exploreQuery,
  personalizedQuery,
  trendingQuery,
  searchPostsQuery,
  hashtagParam,
  hashtagQuery,
  trendingHashtagsQuery,
  createPostBody,
  userPostsParam,
  userPostsQuery,
  postIdParam,
  updatePostBody,
  deletePostParam,
  sharePostParam,
  sharePostBody,
  reportPostParam,
  reportPostBody,
};
