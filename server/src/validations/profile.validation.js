import Joi from 'joi';
import { objectId } from './common.validation.js';

/**
 * Profile Validation Schemas
 * Validation for all endpoints in profile.router.js
 */

// ======================================
// GET /:id (GET_PROFILE_BY_ID)
// Params: { id }
// ======================================
export const profileIdParam = Joi.object({
  id: objectId.required().messages({
    'any.required': 'User ID là bắt buộc',
    'string.pattern.base': 'User ID không hợp lệ',
  }),
});

// ======================================
// PUT / (updateProfileSettings)
// Body: Multipart form with avatar file and profile data
// ======================================
export const updateProfileBody = Joi.object({
  displayName: Joi.string().trim().min(1).max(50).messages({
    'string.min': 'Tên hiển thị phải có ít nhất 1 ký tự',
    'string.max': 'Tên hiển thị không được quá 50 ký tự',
  }),
  bio: Joi.string().trim().max(160).allow('').messages({
    'string.max': 'Bio không được quá 160 ký tự',
  }),
  website: Joi.string().uri().allow('').messages({
    'string.uri': 'Website không hợp lệ',
  }),
  location: Joi.string().trim().max(100).allow('').messages({
    'string.max': 'Địa điểm không được quá 100 ký tự',
  }),
  dateOfBirth: Joi.date().max('now').messages({
    'date.max': 'Ngày sinh không hợp lệ',
  }),
  gender: Joi.string()
    .valid('male', 'female', 'other', 'prefer_not_to_say')
    .messages({
      'any.only': 'Giới tính không hợp lệ',
    }),
  phoneNumber: Joi.string()
    .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .allow('')
    .messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ',
    }),
})
  .min(1)
  .messages({
    'object.min': 'Cần ít nhất một trường để cập nhật',
  });

export default {
  profileIdParam,
  updateProfileBody,
};
