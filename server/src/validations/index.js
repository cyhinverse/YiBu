// Common validation rules
export * from './common.validation.js';

// Module-specific validations
export * as authValidation from './auth.validation.js';
export * as userValidation from './user.validation.js';
export * as postValidation from './post.validation.js';
export * as commentValidation from './comment.validation.js';
export * as messageValidation from './message.validation.js';
export * as reportValidation from './report.validation.js';
export * as notificationValidation from './notification.validation.js';
export * as likeValidation from './like.validation.js';

// Validation middleware
export * from '../middlewares/validation.middleware.js';
