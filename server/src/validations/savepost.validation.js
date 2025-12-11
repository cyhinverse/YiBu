import Joi from 'joi';
import { objectId, paginationQuery } from './common.validation.js';

/**
 * SavePost Validation Schemas
 * Validation cho tất cả endpoints trong savepost.router.js
 */

// ======================================
// GET / (getSavedPosts)
// Query: { page?, limit? }
// ======================================
export const getSavedPostsQuery = paginationQuery;

// ======================================
// GET /collections (getSavedCollections)
// Query: { page?, limit? }
// ======================================
export const getCollectionsQuery = paginationQuery;

// ======================================
// GET /:postId/status (checkSavedStatus)
// Params: { postId }
// ======================================
export const postIdParam = Joi.object({
  postId: objectId.required().messages({
    'any.required': 'Post ID là bắt buộc',
    'string.pattern.base': 'Post ID không hợp lệ',
  }),
});

// ======================================
// POST /:postId (savePost)
// Params: { postId }
// ======================================
export const savePostParam = postIdParam;

// ======================================
// DELETE /:postId (unsavePost)
// Params: { postId }
// ======================================
export const unsavePostParam = postIdParam;

export default {
  getSavedPostsQuery,
  getCollectionsQuery,
  postIdParam,
  savePostParam,
  unsavePostParam,
};
