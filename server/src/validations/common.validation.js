import Joi from 'joi';

/**
 * Common validation rules - Shared validation rules
 */

// MongoDB ObjectId validation
export const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({
    'string.pattern.base': 'ID không hợp lệ',
    'string.empty': 'ID không được để trống',
    'any.required': 'ID là bắt buộc',
  });

// Pagination params
export const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Page phải >= 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.min': 'Limit phải >= 1',
    'number.max': 'Limit tối đa là 100',
  }),
  sort: Joi.string()
    .valid('newest', 'oldest', 'popular', 'createdAt', '-createdAt')
    .default('newest'),
});

// Search query
export const searchQuery = Joi.object({
  q: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Từ khóa tìm kiếm không được để trống',
    'string.min': 'Từ khóa phải có ít nhất 1 ký tự',
    'string.max': 'Từ khóa không được quá 100 ký tự',
    'any.required': 'Từ khóa tìm kiếm là bắt buộc',
  }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

// ID param
export const idParam = Joi.object({
  id: objectId.required(),
});

// User ID param
export const userIdParam = Joi.object({
  userId: objectId.required(),
});

// Post ID param
export const postIdParam = Joi.object({
  postId: objectId.required(),
});

// Comment ID param
export const commentIdParam = Joi.object({
  commentId: objectId.required(),
});

// Message ID param
export const messageIdParam = Joi.object({
  messageId: objectId.required(),
});

// Conversation ID param
export const conversationIdParam = Joi.object({
  conversationId: objectId.required(),
});

export default {
  objectId,
  paginationQuery,
  searchQuery,
  idParam,
  userIdParam,
  postIdParam,
  commentIdParam,
  messageIdParam,
  conversationIdParam,
};
