import Joi from 'joi';
import { objectId } from './common.validation.js';

/**
 * Like Validation Schemas
 * Validation cho tất cả endpoints trong like.router.js
 */

// ======================================
// POST / (CreateLike)
// Body: { postId }
// ======================================
export const createLikeBody = Joi.object({
  postId: objectId.required().messages({
    'any.required': 'Post ID là bắt buộc',
  }),
});

// ======================================
// DELETE / (DeleteLike)
// Body: { postId }
// ======================================
export const deleteLikeBody = Joi.object({
  postId: objectId.required().messages({
    'any.required': 'Post ID là bắt buộc',
  }),
});

// ======================================
// POST /toggle (ToggleLike)
// Body: { postId }
// ======================================
export const toggleLikeBody = Joi.object({
  postId: objectId.required().messages({
    'any.required': 'Post ID là bắt buộc',
  }),
});

// ======================================
// GET /status/:postId (GetLikeStatus)
// Params: { postId }
// ======================================
export const likeStatusParam = Joi.object({
  postId: objectId.required(),
});

// ======================================
// POST /batch-status (GetAllLikeFromPosts)
// Body: { postIds }
// ======================================
export const batchStatusBody = Joi.object({
  postIds: Joi.array().items(objectId).min(1).max(100).required().messages({
    'array.min': 'Phải có ít nhất 1 post ID',
    'array.max': 'Tối đa 100 post IDs',
    'any.required': 'Danh sách post IDs là bắt buộc',
  }),
});

// ======================================
// GET /post/:postId/users (GetPostLikes)
// Params: { postId }
// Query: { page?, limit? }
// ======================================
export const postLikesParam = Joi.object({
  postId: objectId.required(),
});

export const postLikesQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

// ======================================
// GET /my-likes (GetLikedPosts)
// Query: { page?, limit? }
// ======================================
export const myLikesQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

export default {
  createLikeBody,
  deleteLikeBody,
  toggleLikeBody,
  likeStatusParam,
  batchStatusBody,
  postLikesParam,
  postLikesQuery,
  myLikesQuery,
};
