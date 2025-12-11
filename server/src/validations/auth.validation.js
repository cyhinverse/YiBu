import Joi from 'joi';

/**
 * Auth Validation Schemas
 * Validation cho tất cả endpoints trong auth.router.js
 */

// ======================================
// POST /register
// Body: { name, username, email, password, confirmPassword }
// ======================================
export const registerBody = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Tên không được để trống',
    'string.min': 'Tên phải có ít nhất 2 ký tự',
    'string.max': 'Tên không được quá 50 ký tự',
    'any.required': 'Tên là bắt buộc',
  }),
  username: Joi.string()
    .trim()
    .alphanum()
    .min(3)
    .max(30)
    .lowercase()
    .required()
    .messages({
      'string.empty': 'Username không được để trống',
      'string.alphanum': 'Username chỉ được chứa chữ và số',
      'string.min': 'Username phải có ít nhất 3 ký tự',
      'string.max': 'Username không được quá 30 ký tự',
      'any.required': 'Username là bắt buộc',
    }),
  email: Joi.string().trim().email().lowercase().required().messages({
    'string.empty': 'Email không được để trống',
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc',
  }),
  password: Joi.string()
    .min(6)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'Mật khẩu không được để trống',
      'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
      'string.max': 'Mật khẩu không được quá 128 ký tự',
      'string.pattern.base':
        'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
      'any.required': 'Mật khẩu là bắt buộc',
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Xác nhận mật khẩu không khớp',
    'any.required': 'Xác nhận mật khẩu là bắt buộc',
  }),
});

// ======================================
// POST /login
// Body: { email, password, rememberMe? }
// ======================================
export const loginBody = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    'string.empty': 'Email không được để trống',
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Mật khẩu không được để trống',
    'any.required': 'Mật khẩu là bắt buộc',
  }),
  rememberMe: Joi.boolean().default(false),
});

// ======================================
// POST /google
// Body: { credential }
// ======================================
export const googleAuthBody = Joi.object({
  credential: Joi.string().required().messages({
    'string.empty': 'Google credential không được để trống',
    'any.required': 'Google credential là bắt buộc',
  }),
});

// ======================================
// POST /password/reset-request
// Body: { email }
// ======================================
export const forgotPasswordBody = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    'string.empty': 'Email không được để trống',
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc',
  }),
});

// ======================================
// POST /password/reset
// Body: { token, password }
// ======================================
export const resetPasswordBody = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Token không được để trống',
    'any.required': 'Token là bắt buộc',
  }),
  password: Joi.string()
    .min(6)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'Mật khẩu không được để trống',
      'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
      'string.pattern.base':
        'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
      'any.required': 'Mật khẩu là bắt buộc',
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Xác nhận mật khẩu không khớp',
    'any.required': 'Xác nhận mật khẩu là bắt buộc',
  }),
});

// ======================================
// POST /refresh
// Body: { refreshToken }
// ======================================
export const refreshTokenBody = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token không được để trống',
    'any.required': 'Refresh token là bắt buộc',
  }),
});

// ======================================
// PUT /password (update password khi đã login)
// Body: { currentPassword, newPassword, confirmNewPassword }
// ======================================
export const updatePasswordBody = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Mật khẩu hiện tại không được để trống',
    'any.required': 'Mật khẩu hiện tại là bắt buộc',
  }),
  newPassword: Joi.string()
    .min(6)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'Mật khẩu mới không được để trống',
      'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
      'string.pattern.base':
        'Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
      'any.required': 'Mật khẩu mới là bắt buộc',
    }),
  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Xác nhận mật khẩu không khớp',
      'any.required': 'Xác nhận mật khẩu mới là bắt buộc',
    }),
});

// ======================================
// POST /2fa/verify
// Body: { code }
// ======================================
export const verifyTwoFactorBody = Joi.object({
  code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.empty': 'Mã xác thực không được để trống',
    'string.length': 'Mã xác thực phải có 6 chữ số',
    'string.pattern.base': 'Mã xác thực chỉ được chứa số',
    'any.required': 'Mã xác thực là bắt buộc',
  }),
});

// ======================================
// DELETE /sessions/:sessionId
// Params: { sessionId }
// ======================================
export const sessionIdParam = Joi.object({
  sessionId: Joi.string().required().messages({
    'string.empty': 'Session ID không được để trống',
    'any.required': 'Session ID là bắt buộc',
  }),
});

export default {
  registerBody,
  loginBody,
  googleAuthBody,
  forgotPasswordBody,
  resetPasswordBody,
  refreshTokenBody,
  updatePasswordBody,
  verifyTwoFactorBody,
  sessionIdParam,
};
