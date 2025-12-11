import express from 'express';
import PostController from '../controllers/post.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validation.middleware.js';
import {
  createLikeBody,
  deleteLikeBody,
  toggleLikeBody,
  likeStatusParam,
  batchStatusBody,
  postLikesParam,
  postLikesQuery,
  myLikesQuery,
} from '../validations/like.validation.js';

const router = express.Router();

router.use(verifyToken);

// ======================================
// Like Operations
// ======================================
router.post('/', validateBody(createLikeBody), PostController.CreateLike);
router.delete('/', validateBody(deleteLikeBody), PostController.DeleteLike);
router.post('/toggle', validateBody(toggleLikeBody), PostController.ToggleLike);

// ======================================
// Like Status
// ======================================
router.get(
  '/status/:postId',
  validateParams(likeStatusParam),
  PostController.GetLikeStatus
);
router.post(
  '/batch-status',
  validateBody(batchStatusBody),
  PostController.GetAllLikeFromPosts
);
router.get(
  '/post/:postId/users',
  validateParams(postLikesParam),
  validateQuery(postLikesQuery),
  PostController.GetPostLikes
);

// ======================================
// User's Liked Posts
// ======================================
router.get(
  '/my-likes',
  validateQuery(myLikesQuery),
  PostController.GetLikedPosts
);

export default router;
