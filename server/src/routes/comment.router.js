import express from 'express';
import PostController from '../controllers/post.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validation.middleware.js';
import {
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
} from '../validations/comment.validation.js';

const router = express.Router();

router.use(verifyToken);

// ======================================
// Comment CRUD
// ======================================
router.post('/', validateBody(createCommentBody), PostController.createComment);
router.get(
  '/post/:postId',
  validateParams(getCommentsParam),
  validateQuery(getCommentsQuery),
  PostController.getCommentsByPost
);
router.get(
  '/:commentId/replies',
  validateParams(getRepliesParam),
  validateQuery(getRepliesQuery),
  PostController.getCommentReplies
);
router.put(
  '/:id',
  validateParams(updateCommentParam),
  validateBody(updateCommentBody),
  PostController.updateComment
);
router.delete(
  '/:id',
  validateParams(deleteCommentParam),
  PostController.deleteComment
);

// ======================================
// Comment Likes
// ======================================
router.post(
  '/:commentId/like',
  validateParams(likeCommentParam),
  PostController.likeComment
);
router.delete(
  '/:commentId/like',
  validateParams(unlikeCommentParam),
  PostController.unlikeComment
);

export default router;
