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

// ======================================
// Saved Posts
// ======================================
router.get(
  '/',
  validateQuery(getSavedPostsQuery),
  PostController.getSavedPosts
);
router.get(
  '/collections',
  validateQuery(getCollectionsQuery),
  PostController.getSavedCollections
);
router.get(
  '/:postId/status',
  validateParams(postIdParam),
  PostController.checkSavedStatus
);

router.post('/:postId', validateParams(savePostParam), PostController.savePost);
router.delete(
  '/:postId',
  validateParams(unsavePostParam),
  PostController.unsavePost
);

export default router;
