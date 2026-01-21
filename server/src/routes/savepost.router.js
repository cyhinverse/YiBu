import express from 'express';
import PostController from '../controllers/post.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  validateParams,
  validateQuery,
} from '../middlewares/validation.middleware.js';
import {
  getSavedPostsQuery,
  getCollectionsQuery,
  postIdParam,
  savePostParam,
  unsavePostParam,
} from '../validations/savepost.validation.js';

const router = express.Router();

router.use(verifyToken);

/* GET / - Get saved posts for current user */
router.get(
  '/',
  validateQuery(getSavedPostsQuery),
  PostController.getSavedPosts
);
/* GET /collections - Get saved post collections */
router.get(
  '/collections',
  validateQuery(getCollectionsQuery),
  PostController.getSavedCollections
);
/* GET /:postId/status - Check if post is saved */
router.get(
  '/:postId/status',
  validateParams(postIdParam),
  PostController.checkSavedStatus
);

/* POST /:postId - Save a post */
router.post(
  '/:postId',
  validateParams(savePostParam),
  PostController.savePost
);
/* DELETE /:postId - Unsave a post */
router.delete(
  '/:postId',
  validateParams(unsavePostParam),
  PostController.unsavePost
);

export default router;
