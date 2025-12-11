import Joi from 'joi';
import { objectId } from './common.validation.js';

/**
 * Comment Validation Schemas
 * Validation cho tất cả endpoints trong comment.router.js
 */

// ======================================
// POST / (createComment)
// Body: { content, postId, parentId? }
// ======================================
export const createCommentBody = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required().messages({
    'string.empty': 'Nội dung bình luận không được để trống',
    'string.min': 'Nội dung phải có ít nhất 1 ký tự',
    'string.max': 'Nội dung không được quá 1000 ký tự',
    'any.required': 'Nội dung là bắt buộc',
  }),
  postId: objectId.required().messages({
    'any.required': 'Post ID là bắt buộc',
  }),
  parentId: objectId.allow(null).messages({
    'string.pattern.base': 'Parent comment ID không hợp lệ',
  }),
});

// ======================================
// GET /post/:postId (getCommentsByPost)
// Params: { postId }
// Query: { page?, limit?, sort? }
// ======================================
export const getCommentsParam = Joi.object({
  postId: objectId.required(),
});

export const getCommentsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sort: Joi.string().valid('newest', 'oldest', 'popular').default('newest'),
});

// ======================================
// GET /:commentId/replies (getCommentReplies)
// Params: { commentId }
// Query: { page?, limit? }
// ======================================
export const getRepliesParam = Joi.object({
  commentId: objectId.required(),
});

export const getRepliesQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(30).default(10),
});

// ======================================
// PUT /:id (updateComment)
// Params: { id }
// Body: { content }
// ======================================
export const updateCommentParam = Joi.object({
  id: objectId.required(),
});

export const updateCommentBody = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required().messages({
    'string.empty': 'Nội dung bình luận không được để trống',
    'string.min': 'Nội dung phải có ít nhất 1 ký tự',
    'string.max': 'Nội dung không được quá 1000 ký tự',
    'any.required': 'Nội dung là bắt buộc',
  }),
});

// ======================================
// DELETE /:id (deleteComment)
// Params: { id }
// ======================================
export const deleteCommentParam = Joi.object({
  id: objectId.required(),
});

// ======================================
// POST /:commentId/like (likeComment)
// Params: { commentId }
// ======================================
export const likeCommentParam = Joi.object({
  commentId: objectId.required(),
});

// ======================================
// DELETE /:commentId/like (unlikeComment)
// Params: { commentId }
// ======================================
export const unlikeCommentParam = Joi.object({
  commentId: objectId.required(),
});

export default {
  createCommentBody,
  getCommentsParam,
  getCommentsQuery,
  getRepliesParam,
  getRepliesQuery,
  updateCommentParam,
  updateCommentBody,
  deleteCommentParam,
  likeCommentParam,
  unlikeCommentParam,
};
