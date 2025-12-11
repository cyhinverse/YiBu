import express from 'express';
import PostController from '../controllers/post.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multerUpload.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validation.middleware.js';
import {
  getAllPostsQuery,
  exploreQuery,
  personalizedQuery,
  trendingQuery,
  searchPostsQuery,
  hashtagParam,
  hashtagQuery,
  trendingHashtagsQuery,
  createPostBody,
  userPostsParam,
  userPostsQuery,
  postIdParam,
  updatePostBody,
  deletePostParam,
  sharePostParam,
  sharePostBody,
  reportPostParam,
  reportPostBody,
} from '../validations/post.validation.js';

const router = express.Router();

router.use(verifyToken);

// ======================================
// Feeds
// ======================================
router.get('/', validateQuery(getAllPostsQuery), PostController.GetAllPost);
router.get(
  '/explore',
  validateQuery(exploreQuery),
  PostController.GetExploreFeed
);
router.get(
  '/personalized',
  validateQuery(personalizedQuery),
  PostController.GetPersonalizedFeed
);
router.get(
  '/trending',
  validateQuery(trendingQuery),
  PostController.GetTrendingPosts
);

// ======================================
// Search
// ======================================
router.get(
  '/search',
  validateQuery(searchPostsQuery),
  PostController.SearchPosts
);
router.get(
  '/hashtag/:hashtag',
  validateParams(hashtagParam),
  validateQuery(hashtagQuery),
  PostController.GetPostsByHashtag
);
router.get(
  '/hashtags/trending',
  validateQuery(trendingHashtagsQuery),
  PostController.GetTrendingHashtags
);

// ======================================
// Post CRUD
// ======================================
router.post(
  '/',
  upload.array('files', 10),
  validateBody(createPostBody),
  PostController.CreatePost
);
router.get(
  '/user/:id',
  validateParams(userPostsParam),
  validateQuery(userPostsQuery),
  PostController.GetPostUserById
);
router.get('/:id', validateParams(postIdParam), PostController.GetPostById);
router.put(
  '/:id',
  validateParams(postIdParam),
  validateBody(updatePostBody),
  PostController.UpdatePost
);
router.delete(
  '/:id',
  validateParams(deletePostParam),
  PostController.DeletePost
);

// ======================================
// Interactions
// ======================================
router.post(
  '/:postId/share',
  validateParams(sharePostParam),
  validateBody(sharePostBody),
  PostController.sharePost
);
router.post(
  '/:postId/report',
  validateParams(reportPostParam),
  validateBody(reportPostBody),
  PostController.reportPost
);

export default router;
