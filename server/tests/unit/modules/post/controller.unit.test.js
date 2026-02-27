import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import PostController from '../../../../src/modules/post/post.controller.js';
import PostService from '../../../../src/modules/post/post.service.js';
import UserService from '../../../../src/modules/user/user.service.js';
import socketService from '../../../../src/modules/shared/socket/socket.service.js';
import {
  createMockResponse,
  runMiddleware,
} from '../../../shared/middlewareTestUtils.js';

const TEST_USER_ID = '507f191e810c19729de860ea';

describe('PostController', () => {
  it('GetAllPost should pass pagination to home feed service', async () => {
    const originalGetHomeFeed = PostService.getHomeFeed;
    let receivedArgs;

    PostService.getHomeFeed = async (...args) => {
      receivedArgs = args;
      return { posts: [], total: 0 };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        query: { page: '2', limit: '8' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(PostController.GetAllPost, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [TEST_USER_ID, { page: 2, limit: 8 }]);
      assert.equal(res.statusCode, 200);
    } finally {
      PostService.getHomeFeed = originalGetHomeFeed;
    }
  });

  it('GetExploreFeed/GetHashtagFeed/GetPersonalizedFeed should delegate to service', async () => {
    const originalGetExploreFeed = PostService.getExploreFeed;
    const originalGetHashtagFeed = PostService.getHashtagFeed;
    const originalGetPersonalizedFeed = PostService.getPersonalizedFeed;
    let exploreArgs;
    let hashtagArgs;
    let personalizedArgs;

    PostService.getExploreFeed = async (...args) => {
      exploreArgs = args;
      return { posts: [] };
    };
    PostService.getHashtagFeed = async (...args) => {
      hashtagArgs = args;
      return { posts: [] };
    };
    PostService.getPersonalizedFeed = async (...args) => {
      personalizedArgs = args;
      return { posts: [] };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        query: { page: '1', limit: '3' },
      };
      const exploreRes = createMockResponse();
      const hashtagRes = createMockResponse();
      const personalizedRes = createMockResponse();

      const exploreError = await runMiddleware(
        PostController.GetExploreFeed,
        req,
        exploreRes
      );
      const hashtagError = await runMiddleware(
        PostController.GetHashtagFeed,
        req,
        hashtagRes
      );
      const personalizedError = await runMiddleware(
        PostController.GetPersonalizedFeed,
        req,
        personalizedRes
      );

      assert.equal(exploreError, undefined);
      assert.equal(hashtagError, undefined);
      assert.equal(personalizedError, undefined);
      assert.deepEqual(exploreArgs, [TEST_USER_ID, { page: 1, limit: 3 }]);
      assert.deepEqual(hashtagArgs, [TEST_USER_ID, { page: 1, limit: 3 }]);
      assert.deepEqual(personalizedArgs, [TEST_USER_ID, { page: 1, limit: 3 }]);
      assert.equal(exploreRes.statusCode, 200);
      assert.equal(hashtagRes.statusCode, 200);
      assert.equal(personalizedRes.statusCode, 200);
    } finally {
      PostService.getExploreFeed = originalGetExploreFeed;
      PostService.getHashtagFeed = originalGetHashtagFeed;
      PostService.getPersonalizedFeed = originalGetPersonalizedFeed;
    }
  });

  it('SearchPosts should reject short queries', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      query: { q: 'a' },
    };
    const res = createMockResponse();

    const error = await runMiddleware(PostController.SearchPosts, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Query must be at least 2 characters');
  });

  it('SearchPosts should delegate when query is valid', async () => {
    const originalSearchPosts = PostService.searchPosts;
    let receivedArgs;

    PostService.searchPosts = async (...args) => {
      receivedArgs = args;
      return { posts: [], total: 0 };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        query: { q: 'hello', page: '2', limit: '6' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(PostController.SearchPosts, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, ['hello', TEST_USER_ID, { page: 2, limit: 6 }]);
      assert.equal(res.statusCode, 200);
    } finally {
      PostService.searchPosts = originalSearchPosts;
    }
  });

  it('GetTrendingPosts should parse query and delegate', async () => {
    const originalGetTrendingPosts = PostService.getTrendingPosts;
    let receivedArgs;

    PostService.getTrendingPosts = async (...args) => {
      receivedArgs = args;
      return { posts: [] };
    };

    try {
      const req = {
        query: { page: '3', limit: '7', timeframe: 'week' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(PostController.GetTrendingPosts, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [{ page: 3, limit: 7, timeframe: 'week' }]);
      assert.equal(res.statusCode, 200);
    } finally {
      PostService.getTrendingPosts = originalGetTrendingPosts;
    }
  });

  it('GetPostById/GetPostsByHashtag/GetTrendingHashtags should delegate to service', async () => {
    const originalGetPostById = PostService.getPostById;
    const originalGetPostsByHashtag = PostService.getPostsByHashtag;
    const originalGetTrendingHashtags = PostService.getTrendingHashtags;
    let getPostByIdArgs;
    let getPostsByHashtagArgs;
    let getTrendingHashtagsArg;

    PostService.getPostById = async (...args) => {
      getPostByIdArgs = args;
      return { _id: '507f191e810c19729de860ec' };
    };
    PostService.getPostsByHashtag = async (...args) => {
      getPostsByHashtagArgs = args;
      return { posts: [] };
    };
    PostService.getTrendingHashtags = async arg => {
      getTrendingHashtagsArg = arg;
      return [];
    };

    try {
      const postReq = {
        user: { id: TEST_USER_ID },
        params: { id: '507f191e810c19729de860ec' },
      };
      const hashtagReq = {
        user: { id: TEST_USER_ID },
        params: { hashtag: 'nodejs' },
        query: { page: '2', limit: '6' },
      };
      const trendingReq = {
        query: { limit: '12' },
      };

      const postRes = createMockResponse();
      const hashtagRes = createMockResponse();
      const trendingRes = createMockResponse();

      const postError = await runMiddleware(PostController.GetPostById, postReq, postRes);
      const hashtagError = await runMiddleware(
        PostController.GetPostsByHashtag,
        hashtagReq,
        hashtagRes
      );
      const trendingError = await runMiddleware(
        PostController.GetTrendingHashtags,
        trendingReq,
        trendingRes
      );

      assert.equal(postError, undefined);
      assert.equal(hashtagError, undefined);
      assert.equal(trendingError, undefined);
      assert.deepEqual(getPostByIdArgs, ['507f191e810c19729de860ec', TEST_USER_ID]);
      assert.deepEqual(getPostsByHashtagArgs, [
        'nodejs',
        TEST_USER_ID,
        { page: 2, limit: 6 },
      ]);
      assert.equal(getTrendingHashtagsArg, 12);
      assert.equal(postRes.statusCode, 200);
      assert.equal(hashtagRes.statusCode, 200);
      assert.equal(trendingRes.statusCode, 200);
    } finally {
      PostService.getPostById = originalGetPostById;
      PostService.getPostsByHashtag = originalGetPostsByHashtag;
      PostService.getTrendingHashtags = originalGetTrendingHashtags;
    }
  });

  it('GetPostUserById should throw not found when target user cannot be resolved', async () => {
    const originalResolve = UserService.resolveUserIdOrUsername;
    UserService.resolveUserIdOrUsername = async () => null;

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { id: 'missing-user' },
        query: {},
      };
      const res = createMockResponse();

      const error = await runMiddleware(PostController.GetPostUserById, req, res);

      assert.equal(error.statusCode, 404);
      assert.equal(error.message, 'Người dùng không tồn tại');
    } finally {
      UserService.resolveUserIdOrUsername = originalResolve;
    }
  });

  it('GetPostUserById should resolve user and return posts', async () => {
    const originalResolve = UserService.resolveUserIdOrUsername;
    const originalGetUserPosts = PostService.getUserPosts;
    let getUserPostsArgs;

    UserService.resolveUserIdOrUsername = async () => '507f191e810c19729de860eb';
    PostService.getUserPosts = async (...args) => {
      getUserPostsArgs = args;
      return { posts: [], total: 0 };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { id: 'target-user' },
        query: { page: '3', limit: '4' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(PostController.GetPostUserById, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(getUserPostsArgs, [
        '507f191e810c19729de860eb',
        TEST_USER_ID,
        { page: 3, limit: 4 },
      ]);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.resolveUserIdOrUsername = originalResolve;
      PostService.getUserPosts = originalGetUserPosts;
    }
  });

  it('CreateLike should require postId', async () => {
    const req = {
      user: { id: TEST_USER_ID, username: 'tester' },
      body: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(PostController.CreateLike, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Post ID is required');
  });

  it('CreatePost should upload media and delegate payload', async () => {
    const originalUploadMedia = PostService.uploadMedia;
    const originalCreatePost = PostService.createPost;
    let uploadArgs;
    let createArgs;

    PostService.uploadMedia = async (...args) => {
      uploadArgs = args;
      return [{ url: 'https://cdn/image.jpg' }];
    };
    PostService.createPost = async (...args) => {
      createArgs = args;
      return { _id: '507f191e810c19729de860ec' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: { caption: 'hello', visibility: 'followers' },
        files: [{ originalname: 'image.jpg' }],
      };
      const res = createMockResponse();

      const error = await runMiddleware(PostController.CreatePost, req, res);

      assert.equal(error, undefined);
      assert.equal(uploadArgs[1], TEST_USER_ID);
      assert.equal(createArgs[0].caption, 'hello');
      assert.equal(createArgs[0].visibility, 'followers');
      assert.equal(createArgs[0].media.length, 1);
      assert.equal(createArgs[1], TEST_USER_ID);
      assert.equal(res.statusCode, 201);
    } finally {
      PostService.uploadMedia = originalUploadMedia;
      PostService.createPost = originalCreatePost;
    }
  });

  it('UpdatePost should attach uploaded media before service call', async () => {
    const originalUploadMedia = PostService.uploadMedia;
    const originalUpdatePost = PostService.updatePost;
    let updateArgs;

    PostService.uploadMedia = async () => [{ url: 'https://cdn/new.jpg' }];
    PostService.updatePost = async (...args) => {
      updateArgs = args;
      return { _id: '507f191e810c19729de860ec' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { id: '507f191e810c19729de860ec' },
        body: { caption: 'updated' },
        files: [{ originalname: 'new.jpg' }],
      };
      const res = createMockResponse();

      const error = await runMiddleware(PostController.UpdatePost, req, res);

      assert.equal(error, undefined);
      assert.equal(updateArgs[0], '507f191e810c19729de860ec');
      assert.equal(updateArgs[1], TEST_USER_ID);
      assert.equal(updateArgs[2].caption, 'updated');
      assert.equal(updateArgs[2].media.length, 1);
      assert.equal(res.statusCode, 200);
    } finally {
      PostService.uploadMedia = originalUploadMedia;
      PostService.updatePost = originalUpdatePost;
    }
  });

  it('DeletePost should delegate id/user/isAdmin to service', async () => {
    const originalDeletePost = PostService.deletePost;
    let receivedArgs;

    PostService.deletePost = async (...args) => {
      receivedArgs = args;
    };

    try {
      const req = {
        user: { id: TEST_USER_ID, isAdmin: true },
        params: { id: '507f191e810c19729de860ec' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(PostController.DeletePost, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, ['507f191e810c19729de860ec', TEST_USER_ID, true]);
      assert.equal(res.statusCode, 200);
    } finally {
      PostService.deletePost = originalDeletePost;
    }
  });

  it('CreateLike should emit notification when post is newly liked by another user', async () => {
    const originalLikePost = PostService.likePost;
    const originalGetPostById = PostService.getPostById;
    const originalEmitPostLike = socketService.emitPostLike;
    let emitArgs;

    PostService.likePost = async () => ({ alreadyLiked: false, likesCount: 10 });
    PostService.getPostById = async () => ({
      _id: '507f191e810c19729de860ec',
      user: { _id: '507f191e810c19729de860eb' },
    });
    socketService.emitPostLike = (...args) => {
      emitArgs = args;
    };

    try {
      const req = {
        user: { id: TEST_USER_ID, username: 'tester' },
        body: { postId: '507f191e810c19729de860ec' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(PostController.CreateLike, req, res);

      assert.equal(error, undefined);
      assert.equal(emitArgs[0], '507f191e810c19729de860eb');
      assert.equal(emitArgs[1].postId, '507f191e810c19729de860ec');
      assert.equal(res.statusCode, 200);
    } finally {
      PostService.likePost = originalLikePost;
      PostService.getPostById = originalGetPostById;
      socketService.emitPostLike = originalEmitPostLike;
    }
  });

  it('ToggleLike should return proper response message by like state', async () => {
    const originalToggleLike = PostService.toggleLike;
    let toggleCalls = 0;

    PostService.toggleLike = async () => {
      toggleCalls += 1;
      return toggleCalls === 1
        ? { liked: true, count: 1 }
        : { liked: false, count: 0 };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: { postId: '507f191e810c19729de860ec' },
      };
      const res1 = createMockResponse();
      const res2 = createMockResponse();

      const error1 = await runMiddleware(PostController.ToggleLike, req, res1);
      const error2 = await runMiddleware(PostController.ToggleLike, req, res2);

      assert.equal(error1, undefined);
      assert.equal(error2, undefined);
      assert.equal(res1.jsonPayload.message, 'Liked successfully');
      assert.equal(res2.jsonPayload.message, 'Unliked successfully');
    } finally {
      PostService.toggleLike = originalToggleLike;
    }
  });

  it('DeleteLike and GetLikeStatus should validate and return status data', async () => {
    const originalUnlikePost = PostService.unlikePost;
    const originalGetPostById = PostService.getPostById;
    let unlikeArgs;
    let getPostArgs;

    PostService.unlikePost = async (...args) => {
      unlikeArgs = args;
      return { success: true };
    };
    PostService.getPostById = async (...args) => {
      getPostArgs = args;
      return { isLiked: true, likesCount: 11 };
    };

    try {
      const deleteReq = {
        user: { id: TEST_USER_ID },
        body: { postId: '507f191e810c19729de860ec' },
      };
      const statusReq = {
        user: { id: TEST_USER_ID },
        params: { postId: '507f191e810c19729de860ec' },
      };
      const deleteRes = createMockResponse();
      const statusRes = createMockResponse();

      const deleteError = await runMiddleware(
        PostController.DeleteLike,
        deleteReq,
        deleteRes
      );
      const statusError = await runMiddleware(
        PostController.GetLikeStatus,
        statusReq,
        statusRes
      );

      assert.equal(deleteError, undefined);
      assert.equal(statusError, undefined);
      assert.deepEqual(unlikeArgs, ['507f191e810c19729de860ec', TEST_USER_ID]);
      assert.deepEqual(getPostArgs, ['507f191e810c19729de860ec', TEST_USER_ID]);
      assert.equal(deleteRes.statusCode, 200);
      assert.equal(statusRes.jsonPayload.data.isLiked, true);
      assert.equal(statusRes.jsonPayload.data.count, 11);
    } finally {
      PostService.unlikePost = originalUnlikePost;
      PostService.getPostById = originalGetPostById;
    }
  });

  it('DeleteLike/GetLikeStatus/ToggleLike should require postId inputs', async () => {
    const deleteReq = {
      user: { id: TEST_USER_ID },
      body: {},
    };
    const statusReq = {
      user: { id: TEST_USER_ID },
      params: {},
    };
    const toggleReq = {
      user: { id: TEST_USER_ID },
      body: {},
    };
    const deleteRes = createMockResponse();
    const statusRes = createMockResponse();
    const toggleRes = createMockResponse();

    const deleteError = await runMiddleware(PostController.DeleteLike, deleteReq, deleteRes);
    const statusError = await runMiddleware(
      PostController.GetLikeStatus,
      statusReq,
      statusRes
    );
    const toggleError = await runMiddleware(
      PostController.ToggleLike,
      toggleReq,
      toggleRes
    );

    assert.equal(deleteError.statusCode, 400);
    assert.equal(statusError.statusCode, 400);
    assert.equal(toggleError.statusCode, 400);
  });

  it('GetPostLikes/GetLikedPosts/GetSharedPosts should delegate with pagination', async () => {
    const originalGetPostLikes = PostService.getPostLikes;
    const originalGetLikedPosts = PostService.getLikedPosts;
    const originalGetSharedPosts = PostService.getSharedPosts;
    let getPostLikesArgs;
    let getLikedPostsArgs;
    let getSharedPostsArgs;

    PostService.getPostLikes = async (...args) => {
      getPostLikesArgs = args;
      return [];
    };
    PostService.getLikedPosts = async (...args) => {
      getLikedPostsArgs = args;
      return { posts: [] };
    };
    PostService.getSharedPosts = async (...args) => {
      getSharedPostsArgs = args;
      return { posts: [] };
    };

    try {
      const postLikesReq = {
        params: { postId: '507f191e810c19729de860ec' },
        query: { page: '2', limit: '4' },
      };
      const likedPostsReq = {
        user: { id: TEST_USER_ID },
        query: { page: '3', limit: '5' },
      };
      const sharedPostsReq = {
        user: { id: TEST_USER_ID },
        params: { id: '507f191e810c19729de860eb' },
        query: { page: '1', limit: '7' },
      };

      const postLikesRes = createMockResponse();
      const likedPostsRes = createMockResponse();
      const sharedPostsRes = createMockResponse();

      const postLikesError = await runMiddleware(
        PostController.GetPostLikes,
        postLikesReq,
        postLikesRes
      );
      const likedPostsError = await runMiddleware(
        PostController.GetLikedPosts,
        likedPostsReq,
        likedPostsRes
      );
      const sharedPostsError = await runMiddleware(
        PostController.GetSharedPosts,
        sharedPostsReq,
        sharedPostsRes
      );

      assert.equal(postLikesError, undefined);
      assert.equal(likedPostsError, undefined);
      assert.equal(sharedPostsError, undefined);
      assert.deepEqual(getPostLikesArgs, [
        '507f191e810c19729de860ec',
        { page: 2, limit: 4 },
      ]);
      assert.deepEqual(getLikedPostsArgs, [
        TEST_USER_ID,
        { page: 3, limit: 5 },
      ]);
      assert.deepEqual(getSharedPostsArgs, [
        '507f191e810c19729de860eb',
        { page: 1, limit: 7 },
      ]);
      assert.equal(postLikesRes.statusCode, 200);
      assert.equal(likedPostsRes.statusCode, 200);
      assert.equal(sharedPostsRes.statusCode, 200);
    } finally {
      PostService.getPostLikes = originalGetPostLikes;
      PostService.getLikedPosts = originalGetLikedPosts;
      PostService.getSharedPosts = originalGetSharedPosts;
    }
  });

  it('GetAllLikeFromPosts should fallback to default values when fetching a post fails', async () => {
    const originalGetPostById = PostService.getPostById;

    PostService.getPostById = async postId => {
      if (postId === 'bad') {
        throw new Error('Not found');
      }
      return { likesCount: 3, isLiked: true };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: { postIds: ['good', 'bad'] },
      };
      const res = createMockResponse();

      const error = await runMiddleware(PostController.GetAllLikeFromPosts, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(res.jsonPayload.data.good, { count: 3, isLiked: true });
      assert.deepEqual(res.jsonPayload.data.bad, { count: 0, isLiked: false });
      assert.equal(res.statusCode, 200);
    } finally {
      PostService.getPostById = originalGetPostById;
    }
  });

  it('GetAllLikeFromPosts should reject invalid postIds input', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      body: { postIds: [] },
    };
    const res = createMockResponse();

    const error = await runMiddleware(PostController.GetAllLikeFromPosts, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Valid post IDs array is required');
  });

  it('savePost/unsavePost/checkSavedStatus should validate postId and delegate', async () => {
    const originalSavePost = PostService.savePost;
    const originalUnsavePost = PostService.unsavePost;
    const originalGetPostById = PostService.getPostById;
    let saveArgs;
    let unsaveArgs;

    PostService.savePost = async (...args) => {
      saveArgs = args;
      return { saved: true };
    };
    PostService.unsavePost = async (...args) => {
      unsaveArgs = args;
    };
    PostService.getPostById = async () => ({ isSaved: true });

    try {
      const saveReq = {
        user: { id: TEST_USER_ID },
        params: { postId: '507f191e810c19729de860ec' },
        body: { collection: 'favorites' },
      };
      const unsaveReq = {
        user: { id: TEST_USER_ID },
        params: { postId: '507f191e810c19729de860ec' },
      };
      const checkReq = {
        user: { id: TEST_USER_ID },
        params: { postId: '507f191e810c19729de860ec' },
      };
      const saveRes = createMockResponse();
      const unsaveRes = createMockResponse();
      const checkRes = createMockResponse();

      const saveError = await runMiddleware(PostController.savePost, saveReq, saveRes);
      const unsaveError = await runMiddleware(
        PostController.unsavePost,
        unsaveReq,
        unsaveRes
      );
      const checkError = await runMiddleware(
        PostController.checkSavedStatus,
        checkReq,
        checkRes
      );

      assert.equal(saveError, undefined);
      assert.equal(unsaveError, undefined);
      assert.equal(checkError, undefined);
      assert.deepEqual(saveArgs, ['507f191e810c19729de860ec', TEST_USER_ID, 'favorites']);
      assert.deepEqual(unsaveArgs, ['507f191e810c19729de860ec', TEST_USER_ID]);
      assert.equal(saveRes.statusCode, 200);
      assert.equal(unsaveRes.statusCode, 200);
      assert.equal(checkRes.jsonPayload.data.isSaved, true);
    } finally {
      PostService.savePost = originalSavePost;
      PostService.unsavePost = originalUnsavePost;
      PostService.getPostById = originalGetPostById;
    }
  });

  it('savePost/unsavePost/checkSavedStatus should validate missing postId', async () => {
    const saveReq = { user: { id: TEST_USER_ID }, params: {}, body: {} };
    const unsaveReq = { user: { id: TEST_USER_ID }, params: {} };
    const checkReq = { user: { id: TEST_USER_ID }, params: {} };

    const saveRes = createMockResponse();
    const unsaveRes = createMockResponse();
    const checkRes = createMockResponse();

    const saveError = await runMiddleware(PostController.savePost, saveReq, saveRes);
    const unsaveError = await runMiddleware(PostController.unsavePost, unsaveReq, unsaveRes);
    const checkError = await runMiddleware(
      PostController.checkSavedStatus,
      checkReq,
      checkRes
    );

    assert.equal(saveError.statusCode, 400);
    assert.equal(unsaveError.statusCode, 400);
    assert.equal(checkError.statusCode, 400);
  });

  it('getSavedPosts/getSavedCollections/getCommentsByPost should delegate with parsed query', async () => {
    const originalGetSavedPosts = PostService.getSavedPosts;
    const originalGetSavedCollections = PostService.getSavedCollections;
    const originalGetComments = PostService.getComments;
    let savedPostsArgs;
    let savedCollectionsArgs;
    let commentsArgs;

    PostService.getSavedPosts = async (...args) => {
      savedPostsArgs = args;
      return { posts: [] };
    };
    PostService.getSavedCollections = async (...args) => {
      savedCollectionsArgs = args;
      return [];
    };
    PostService.getComments = async (...args) => {
      commentsArgs = args;
      return { comments: [] };
    };

    try {
      const savedPostsReq = {
        user: { id: TEST_USER_ID },
        query: { page: '2', limit: '9', collection: 'favorites' },
      };
      const collectionsReq = {
        user: { id: TEST_USER_ID },
      };
      const commentsReq = {
        params: { postId: '507f191e810c19729de860ec' },
        query: { page: '3', limit: '4', sort: 'newest' },
      };

      const savedPostsRes = createMockResponse();
      const collectionsRes = createMockResponse();
      const commentsRes = createMockResponse();

      const savedPostsError = await runMiddleware(
        PostController.getSavedPosts,
        savedPostsReq,
        savedPostsRes
      );
      const collectionsError = await runMiddleware(
        PostController.getSavedCollections,
        collectionsReq,
        collectionsRes
      );
      const commentsError = await runMiddleware(
        PostController.getCommentsByPost,
        commentsReq,
        commentsRes
      );

      assert.equal(savedPostsError, undefined);
      assert.equal(collectionsError, undefined);
      assert.equal(commentsError, undefined);
      assert.deepEqual(savedPostsArgs, [
        TEST_USER_ID,
        { page: 2, limit: 9, collection: 'favorites' },
      ]);
      assert.deepEqual(savedCollectionsArgs, [TEST_USER_ID]);
      assert.deepEqual(commentsArgs, [
        '507f191e810c19729de860ec',
        { page: 3, limit: 4, sort: 'newest' },
      ]);
      assert.equal(savedPostsRes.statusCode, 200);
      assert.equal(collectionsRes.statusCode, 200);
      assert.equal(commentsRes.statusCode, 200);
    } finally {
      PostService.getSavedPosts = originalGetSavedPosts;
      PostService.getSavedCollections = originalGetSavedCollections;
      PostService.getComments = originalGetComments;
    }
  });

  it('getCommentsByPost should require postId', async () => {
    const req = {
      params: {},
      query: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(PostController.getCommentsByPost, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'ID bài viết là bắt buộc');
  });

  it('getCommentReplies/updateComment/deleteComment should delegate to service', async () => {
    const originalGetCommentReplies = PostService.getCommentReplies;
    const originalUpdateComment = PostService.updateComment;
    const originalDeleteComment = PostService.deleteComment;
    let getCommentRepliesArgs;
    let updateCommentArgs;
    let deleteCommentArgs;

    PostService.getCommentReplies = async (...args) => {
      getCommentRepliesArgs = args;
      return { replies: [] };
    };
    PostService.updateComment = async (...args) => {
      updateCommentArgs = args;
      return { _id: '507f191e810c19729de860ef' };
    };
    PostService.deleteComment = async (...args) => {
      deleteCommentArgs = args;
    };

    try {
      const repliesReq = {
        params: { commentId: '507f191e810c19729de860ec' },
        query: { page: '2', limit: '3' },
      };
      const updateReq = {
        user: { id: TEST_USER_ID },
        params: { id: '507f191e810c19729de860ec' },
        body: { content: 'updated comment' },
      };
      const deleteReq = {
        user: { id: TEST_USER_ID, isAdmin: false },
        params: { id: '507f191e810c19729de860ec' },
      };

      const repliesRes = createMockResponse();
      const updateRes = createMockResponse();
      const deleteRes = createMockResponse();

      const repliesError = await runMiddleware(
        PostController.getCommentReplies,
        repliesReq,
        repliesRes
      );
      const updateError = await runMiddleware(
        PostController.updateComment,
        updateReq,
        updateRes
      );
      const deleteError = await runMiddleware(
        PostController.deleteComment,
        deleteReq,
        deleteRes
      );

      assert.equal(repliesError, undefined);
      assert.equal(updateError, undefined);
      assert.equal(deleteError, undefined);
      assert.deepEqual(getCommentRepliesArgs, [
        '507f191e810c19729de860ec',
        { page: 2, limit: 3 },
      ]);
      assert.deepEqual(updateCommentArgs, [
        '507f191e810c19729de860ec',
        TEST_USER_ID,
        'updated comment',
      ]);
      assert.deepEqual(deleteCommentArgs, [
        '507f191e810c19729de860ec',
        TEST_USER_ID,
        false,
      ]);
      assert.equal(repliesRes.statusCode, 200);
      assert.equal(updateRes.statusCode, 200);
      assert.equal(deleteRes.statusCode, 200);
    } finally {
      PostService.getCommentReplies = originalGetCommentReplies;
      PostService.updateComment = originalUpdateComment;
      PostService.deleteComment = originalDeleteComment;
    }
  });

  it('updateComment should reject empty content', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      params: { id: '507f191e810c19729de860ec' },
      body: { content: '   ' },
    };
    const res = createMockResponse();

    const error = await runMiddleware(PostController.updateComment, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Nội dung comment không được để trống');
  });

  it('likeComment/unlikeComment/sharePost should delegate to service', async () => {
    const originalLikeComment = PostService.likeComment;
    const originalUnlikeComment = PostService.unlikeComment;
    const originalSharePost = PostService.sharePost;
    let likeCommentArgs;
    let unlikeCommentArgs;
    let sharePostArgs;

    PostService.likeComment = async (...args) => {
      likeCommentArgs = args;
      return { liked: true };
    };
    PostService.unlikeComment = async (...args) => {
      unlikeCommentArgs = args;
      return { liked: false };
    };
    PostService.sharePost = async (...args) => {
      sharePostArgs = args;
      return { shared: true };
    };

    try {
      const likeReq = {
        user: { id: TEST_USER_ID },
        params: { commentId: '507f191e810c19729de860ec' },
      };
      const unlikeReq = {
        user: { id: TEST_USER_ID },
        params: { commentId: '507f191e810c19729de860ec' },
      };
      const shareReq = {
        user: { id: TEST_USER_ID },
        params: { postId: '507f191e810c19729de860eb' },
        body: { platform: 'twitter' },
      };

      const likeRes = createMockResponse();
      const unlikeRes = createMockResponse();
      const shareRes = createMockResponse();

      const likeError = await runMiddleware(PostController.likeComment, likeReq, likeRes);
      const unlikeError = await runMiddleware(
        PostController.unlikeComment,
        unlikeReq,
        unlikeRes
      );
      const shareError = await runMiddleware(PostController.sharePost, shareReq, shareRes);

      assert.equal(likeError, undefined);
      assert.equal(unlikeError, undefined);
      assert.equal(shareError, undefined);
      assert.deepEqual(likeCommentArgs, ['507f191e810c19729de860ec', TEST_USER_ID]);
      assert.deepEqual(unlikeCommentArgs, ['507f191e810c19729de860ec', TEST_USER_ID]);
      assert.deepEqual(sharePostArgs, ['507f191e810c19729de860eb', TEST_USER_ID, 'twitter']);
      assert.equal(likeRes.statusCode, 200);
      assert.equal(unlikeRes.statusCode, 200);
      assert.equal(shareRes.statusCode, 200);
    } finally {
      PostService.likeComment = originalLikeComment;
      PostService.unlikeComment = originalUnlikeComment;
      PostService.sharePost = originalSharePost;
    }
  });

  it('createComment should create comment and emit socket events', async () => {
    const originalAddComment = PostService.addComment;
    const originalGetPostById = PostService.getPostById;
    const originalEmitToRoom = socketService.emitToRoom;
    const originalEmitPostComment = socketService.emitPostComment;
    let addCommentArgs;
    let roomEmitArgs;
    let postCommentEmitArgs;

    PostService.addComment = async (...args) => {
      addCommentArgs = args;
      return { _id: '507f191e810c19729de860ef' };
    };
    PostService.getPostById = async () => ({
      user: { _id: '507f191e810c19729de860eb' },
    });
    socketService.emitToRoom = (...args) => {
      roomEmitArgs = args;
    };
    socketService.emitPostComment = (...args) => {
      postCommentEmitArgs = args;
    };

    try {
      const req = {
        user: { id: TEST_USER_ID, username: 'tester' },
        body: {
          content: 'This is a comment',
          postId: '507f191e810c19729de860ec',
          parentId: null,
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(PostController.createComment, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(addCommentArgs, [
        '507f191e810c19729de860ec',
        TEST_USER_ID,
        'This is a comment',
        null,
      ]);
      assert.equal(roomEmitArgs[0], 'post:507f191e810c19729de860ec');
      assert.equal(postCommentEmitArgs[0], '507f191e810c19729de860eb');
      assert.equal(res.statusCode, 201);
    } finally {
      PostService.addComment = originalAddComment;
      PostService.getPostById = originalGetPostById;
      socketService.emitToRoom = originalEmitToRoom;
      socketService.emitPostComment = originalEmitPostComment;
    }
  });

  it('createComment should require non-empty content', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      body: {
        content: '   ',
        postId: '507f191e810c19729de860ec',
      },
    };
    const res = createMockResponse();

    const error = await runMiddleware(PostController.createComment, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Nội dung comment không được để trống');
  });

  it('createComment should require postId', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      body: {
        content: 'Hello',
      },
    };
    const res = createMockResponse();

    const error = await runMiddleware(PostController.createComment, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'ID bài viết là bắt buộc');
  });

  it('reportPost should require reason', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      params: { postId: '507f191e810c19729de860ec' },
      body: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(PostController.reportPost, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Lý do báo cáo là bắt buộc');
  });

  it('reportPost should delegate report payload to service', async () => {
    const originalReportPost = PostService.reportPost;
    let receivedArgs;

    PostService.reportPost = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860ef' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { postId: '507f191e810c19729de860ec' },
        body: { reason: 'spam', description: 'spam links' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(PostController.reportPost, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        '507f191e810c19729de860ec',
        TEST_USER_ID,
        'spam',
        'spam links',
      ]);
      assert.equal(res.statusCode, 200);
    } finally {
      PostService.reportPost = originalReportPost;
    }
  });
});

