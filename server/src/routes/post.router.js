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

/* GET / - Get home feed posts */
router.get('/', validateQuery(getAllPostsQuery), PostController.GetAllPost);
/* GET /explore - Get explore feed posts */
router.get(
  '/explore',
  validateQuery(exploreQuery),
  PostController.GetExploreFeed
);
/* GET /personalized - Get personalized feed */
router.get(
  '/personalized',
  validateQuery(personalizedQuery),
  PostController.GetPersonalizedFeed
);
/* GET /trending - Get trending posts */
router.get(
  '/trending',
  validateQuery(trendingQuery),
  PostController.GetTrendingPosts
);

/* GET /search - Search posts */
router.get(
  '/search',
  validateQuery(searchPostsQuery),
  PostController.SearchPosts
);
/* GET /hashtag/:hashtag - Get posts by hashtag */
router.get(
  '/hashtag/:hashtag',
  validateParams(hashtagParam),
  validateQuery(hashtagQuery),
  PostController.GetPostsByHashtag
);
/* GET /hashtags/trending - Get trending hashtags */
router.get(
  '/hashtags/trending',
  validateQuery(trendingHashtagsQuery),
  PostController.GetTrendingHashtags
);

/* POST / - Create new post */
router.post(
  '/',
  upload.array('files', 10),
  validateBody(createPostBody),
  PostController.CreatePost
);
/* GET /user/:id - Get posts by user ID */
router.get(
  '/user/:id',
  validateParams(userPostsParam),
  validateQuery(userPostsQuery),
  validateQuery(userPostsQuery),
  PostController.GetPostUserById
);

/* GET /user/:id/shared - Get shared posts by user */
router.get(
  '/user/:id/shared',
  validateParams(userPostsParam),
  validateQuery(userPostsQuery),
  PostController.GetSharedPosts
);

/* GET /:id - Get single post by ID */
router.get('/:id', validateParams(postIdParam), PostController.GetPostById);
/* PUT /:id - Update existing post */
router.put(
  '/:id',
  upload.array('files', 10),
  validateParams(postIdParam),
  validateBody(updatePostBody),
  PostController.UpdatePost
);
/* DELETE /:id - Delete a post */
router.delete(
  '/:id',
  validateParams(deletePostParam),
  PostController.DeletePost
);

/* POST /:postId/share - Share a post */
router.post(
  '/:postId/share',
  validateParams(sharePostParam),
  validateBody(sharePostBody),
  PostController.sharePost
);
/* POST /:postId/report - Report a post */
router.post(
  '/:postId/report',
  validateParams(reportPostParam),
  validateBody(reportPostBody),
  PostController.reportPost
);

export default router;
