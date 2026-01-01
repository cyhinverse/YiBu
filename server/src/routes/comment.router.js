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

/* POST / - Create a new comment */
router.post('/', validateBody(createCommentBody), PostController.createComment);
/* GET /post/:postId - Get comments for a post */
router.get(
  '/post/:postId',
  validateParams(getCommentsParam),
  validateQuery(getCommentsQuery),
  PostController.getCommentsByPost
);
/* GET /:commentId/replies - Get replies for a comment */
router.get(
  '/:commentId/replies',
  validateParams(getRepliesParam),
  validateQuery(getRepliesQuery),
  PostController.getCommentReplies
);
/* PUT /:id - Update a comment */
router.put(
  '/:id',
  validateParams(updateCommentParam),
  validateBody(updateCommentBody),
  PostController.updateComment
);
/* DELETE /:id - Delete a comment */
router.delete(
  '/:id',
  validateParams(deleteCommentParam),
  PostController.deleteComment
);

/* POST /:commentId/like - Like a comment */
router.post(
  '/:commentId/like',
  validateParams(likeCommentParam),
  PostController.likeComment
);
/* DELETE /:commentId/like - Unlike a comment */
router.delete(
  '/:commentId/like',
  validateParams(unlikeCommentParam),
  PostController.unlikeComment
);

export default router;
