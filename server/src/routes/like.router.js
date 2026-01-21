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

/* POST / - Like a post */
router.post('/', validateBody(createLikeBody), PostController.CreateLike);
/* DELETE / - Unlike a post */
router.delete('/', validateBody(deleteLikeBody), PostController.DeleteLike);
/* POST /toggle - Toggle like status on a post */
router.post(
  '/toggle',
  validateBody(toggleLikeBody),
  PostController.ToggleLike
);

/* GET /status/:postId - Get like status for a post */
router.get(
  '/status/:postId',
  validateParams(likeStatusParam),
  PostController.GetLikeStatus
);
/* POST /batch-status - Get like status for multiple posts */
router.post(
  '/batch-status',
  validateBody(batchStatusBody),
  PostController.GetAllLikeFromPosts
);
/* GET /post/:postId/users - Get users who liked a post */
router.get(
  '/post/:postId/users',
  validateParams(postLikesParam),
  validateQuery(postLikesQuery),
  PostController.GetPostLikes
);

/* GET /my-likes - Get posts liked by current user */
router.get(
  '/my-likes',
  validateQuery(myLikesQuery),
  PostController.GetLikedPosts
);

export default router;
