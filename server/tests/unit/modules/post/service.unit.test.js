import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import PostService from '../../../../src/modules/post/post.service.js';
import postRepository from '../../../../src/modules/post/post.repository.js';
import cloudinary from '../../../../src/configs/cloudinaryConfig.js';

const USER_ID = '507f191e810c19729de860ea';
const OTHER_ID = '507f191e810c19729de860eb';

const originalRepositoryMethods = { ...postRepository };
const originalAddUserStatus = PostService._addUserStatus;
const originalProcessHashtags = PostService._processHashtags;
const originalLikePost = PostService.likePost;
const originalUnlikePost = PostService.unlikePost;
const originalStartSession = mongoose.startSession;
const originalCloudinaryUploadStream = cloudinary.uploader.upload_stream;
const originalHashtagGlobal = globalThis.Hashtag;
const cloudinaryEnvKeys = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];
const originalCloudinaryEnv = Object.fromEntries(
  cloudinaryEnvKeys.map(key => [key, process.env[key]])
);

function makePopulateLeanChain(value) {
  return {
    populate() {
      return this;
    },
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    limit() {
      return this;
    },
    select() {
      return this;
    },
    lean: async () => value,
  };
}

afterEach(() => {
  Object.assign(postRepository, originalRepositoryMethods);
  PostService._addUserStatus = originalAddUserStatus;
  PostService._processHashtags = originalProcessHashtags;
  PostService.likePost = originalLikePost;
  PostService.unlikePost = originalUnlikePost;
  mongoose.startSession = originalStartSession;
  cloudinary.uploader.upload_stream = originalCloudinaryUploadStream;
  if (originalHashtagGlobal === undefined) {
    delete globalThis.Hashtag;
  } else {
    globalThis.Hashtag = originalHashtagGlobal;
  }
  for (const key of cloudinaryEnvKeys) {
    if (originalCloudinaryEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalCloudinaryEnv[key];
    }
  }
});

describe('PostService', () => {
  it('createPost should create post in transaction and return populated post', async () => {
    let createdPayload;
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => session;
    PostService._processHashtags = async () => ['tag-one'];
    postRepository.postCreate = async payload => {
      createdPayload = payload;
      return [{ _id: 'post-created' }];
    };
    postRepository.userFindByIdAndUpdate = () => ({
      session: async () => ({}),
    });
    postRepository.postFindById = () =>
      makePopulateLeanChain({ _id: 'post-created', caption: 'hello' });

    const result = await PostService.createPost(
      { caption: 'hello #tag-one' },
      USER_ID
    );

    assert.equal(createdPayload[0].user, USER_ID);
    assert.deepEqual(createdPayload[0].hashtags, ['tag-one']);
    assert.equal(result._id, 'post-created');
  });

  it('createPost should abort transaction when processing fails', async () => {
    let aborted = false;
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {
        aborted = true;
      },
      endSession() {},
    };
    mongoose.startSession = async () => session;
    PostService._processHashtags = async () => {
      throw new Error('boom');
    };

    await assert.rejects(
      PostService.createPost({ caption: '#fail' }, USER_ID),
      /boom/
    );
    assert.equal(aborted, true);
  });

  it('_processHashtags should normalize and increment hashtags via bulk method', async () => {
    let incrementedTags;
    globalThis.Hashtag = { incrementMany: true };
    postRepository.hashtagIncrementMany = async tags => {
      incrementedTags = tags;
    };

    const tags = await PostService._processHashtags('#Node #node #JS', null);

    assert.deepEqual(tags, ['node', 'js']);
    assert.deepEqual(incrementedTags, ['node', 'js']);
  });

  it('_processHashtags should fallback to per-tag updates and cap to 30 ops', async () => {
    let updateCount = 0;
    globalThis.Hashtag = { incrementMany: false };
    postRepository.hashtagFindOneAndUpdate = async () => {
      updateCount += 1;
      return {};
    };
    const caption = Array.from({ length: 32 }, (_, i) => `#tag${i}`).join(' ');

    const tags = await PostService._processHashtags(caption, 'session');

    assert.equal(tags.length, 32);
    assert.equal(updateCount, 30);
  });

  it('getLikedPosts should filter missing posts and compute hasMore', async () => {
    postRepository.likeFind = () =>
      makePopulateLeanChain([{ post: { _id: 'post-like-1' } }, { post: null }]);
    postRepository.likeCountDocuments = async () => 2;
    PostService._addUserStatus = async posts => posts.map(p => ({ ...p, isLiked: true }));

    const result = await PostService.getLikedPosts(USER_ID, { page: 1, limit: 1 });

    assert.equal(result.posts.length, 1);
    assert.equal(result.posts[0].isLiked, true);
    assert.equal(result.hasMore, true);
  });

  it('getSharedPosts should preserve interaction order and apply user status', async () => {
    let orderedIds = [];
    postRepository.userInteractionFind = () =>
      makePopulateLeanChain([{ targetId: 'post-2' }, { targetId: 'post-1' }]);
    postRepository.postFind = query => {
      if (query._id) {
        return makePopulateLeanChain([{ _id: 'post-1' }, { _id: 'post-2' }]);
      }
      return makePopulateLeanChain([]);
    };
    postRepository.userInteractionCountDocuments = async () => 2;
    PostService._addUserStatus = async posts => {
      orderedIds = posts.map(p => p._id);
      return posts;
    };

    const result = await PostService.getSharedPosts(USER_ID, { page: 1, limit: 1 });

    assert.deepEqual(orderedIds, ['post-2', 'post-1']);
    assert.equal(result.hasMore, true);
  });

  it('updatePost should reject unauthorized owner', async () => {
    postRepository.postFindOne = async () => null;
    await assert.rejects(
      PostService.updatePost('post-unauthorized', USER_ID, {}),
      err => err?.statusCode === 403
    );
  });

  it('updatePost should handle invalid existingMedia and update removed hashtags', async () => {
    let hashtagUpdateQuery;
    let postUpdatePayload;
    postRepository.postFindOne = async () => ({
      media: [{ url: 'old' }],
      hashtags: ['old', 'keep'],
    });
    PostService._processHashtags = async () => ['keep', 'new'];
    postRepository.hashtagUpdateMany = async query => {
      hashtagUpdateQuery = query;
      return {};
    };
    postRepository.postFindByIdAndUpdate = (_id, payload) => {
      postUpdatePayload = payload;
      return {
        populate: async () => ({ _id: 'post-updated', payload }),
      };
    };

    const result = await PostService.updatePost('post-updated', USER_ID, {
      caption: '#keep #new',
      existingMedia: '{bad-json',
      media: [{ url: 'new' }],
      visibility: 'followers',
      mentions: [OTHER_ID],
    });

    assert.deepEqual(hashtagUpdateQuery, { name: { $in: ['old'] } });
    assert.deepEqual(postUpdatePayload.$set.media, [{ url: 'new' }]);
    assert.deepEqual(postUpdatePayload.$set.hashtags, ['keep', 'new']);
    assert.equal(result._id, 'post-updated');
  });

  it('updatePost should keep parsed existingMedia when no new media is provided', async () => {
    let updatePayload;
    postRepository.postFindOne = async () => ({
      media: [{ url: 'old-media' }],
      hashtags: [],
    });
    postRepository.postFindByIdAndUpdate = (_id, payload) => {
      updatePayload = payload;
      return {
        populate: async () => ({ _id: 'post-existing-media' }),
      };
    };

    await PostService.updatePost('post-existing-media', USER_ID, {
      existingMedia: JSON.stringify([{ url: 'kept-media' }]),
      location: 'VN',
    });

    assert.deepEqual(updatePayload.$set.media, [{ url: 'kept-media' }]);
    assert.equal(updatePayload.$set.location, 'VN');
  });

  it('deletePost should abort when target post is missing', async () => {
    let aborted = false;
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {
        aborted = true;
      },
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.postFindOne = () => ({
      session: async () => null,
    });

    await assert.rejects(
      PostService.deletePost('post-missing', USER_ID),
      err => err?.statusCode === 403
    );
    assert.equal(aborted, true);
  });

  it('deletePost should soft-delete and decrement hashtag usage', async () => {
    let hashtagSessionUsed = false;
    const post = {
      _id: 'post-delete',
      user: USER_ID,
      hashtags: ['TagA'],
      save: async () => {},
    };
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.postFindOne = () => ({
      session: async () => post,
    });
    postRepository.userFindByIdAndUpdate = () => ({
      session: async () => ({}),
    });
    postRepository.hashtagUpdateMany = () => ({
      session: async provided => {
        hashtagSessionUsed = !!provided;
        return {};
      },
    });

    const result = await PostService.deletePost('post-delete', USER_ID);

    assert.equal(result._id, 'post-delete');
    assert.equal(post.isDeleted, true);
    assert.equal(hashtagSessionUsed, true);
  });

  it('getPostById should throw when post does not exist', async () => {
    postRepository.postFindOne = () => makePopulateLeanChain(null);

    await assert.rejects(
      PostService.getPostById('post-404'),
      err => err?.statusCode === 404
    );
  });

  it('getPostById should enrich with like/save status and record view', async () => {
    let interactionPayload;
    postRepository.postFindOne = () => makePopulateLeanChain({ _id: 'post-view' });
    postRepository.likeExists = async () => ({ _id: 'like' });
    postRepository.savePostExists = async () => null;
    postRepository.userInteractionRecord = async payload => {
      interactionPayload = payload;
    };

    const result = await PostService.getPostById('post-view', USER_ID);

    assert.equal(result.isLiked, true);
    assert.equal(result.isSaved, false);
    assert.equal(interactionPayload.interactionType, 'view');
  });

  it('getPostById should return raw post when viewer is anonymous', async () => {
    postRepository.postFindOne = () => makePopulateLeanChain({ _id: 'post-public' });
    postRepository.likeExists = async () => {
      throw new Error('should not be called');
    };

    const result = await PostService.getPostById('post-public');
    assert.equal(result._id, 'post-public');
  });

  it('getUserPosts should include private visibility for owner', async () => {
    let queryFromFind;
    postRepository.postFind = query => {
      queryFromFind = query;
      return makePopulateLeanChain([{ _id: 'post-self' }]);
    };
    postRepository.postCountDocuments = async () => 1;
    PostService._addUserStatus = async posts => posts.map(p => ({ ...p, isSaved: true }));

    const result = await PostService.getUserPosts(USER_ID, USER_ID, { page: 1, limit: 1 });

    assert.deepEqual(queryFromFind.visibility.$in, ['public', 'followers', 'private']);
    assert.equal(result.posts[0].isSaved, true);
  });

  it('getUserPosts should include followers visibility when requester follows', async () => {
    let queryFromFind;
    postRepository.followIsFollowing = async () => true;
    postRepository.postFind = query => {
      queryFromFind = query;
      return makePopulateLeanChain([]);
    };
    postRepository.postCountDocuments = async () => 0;
    PostService._addUserStatus = async posts => posts;

    await PostService.getUserPosts(USER_ID, OTHER_ID, { page: 1, limit: 10 });

    assert.deepEqual(queryFromFind.visibility.$in, ['public', 'followers']);
  });

  it('getHomeFeed should exclude blocked and muted users', async () => {
    let queryFromFind;
    postRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({
          blockedUsers: [OTHER_ID],
          mutedUsers: ['muted-user'],
        }),
      }),
    });
    postRepository.followGetFollowingIds = async () => [OTHER_ID, 'muted-user', 'friend-user'];
    postRepository.postFind = query => {
      queryFromFind = query;
      return makePopulateLeanChain([{ _id: 'feed-1' }]);
    };
    PostService._addUserStatus = async posts => posts;

    const result = await PostService.getHomeFeed(USER_ID, { page: 1, limit: 1 });

    assert.equal(queryFromFind.user.$in.includes(USER_ID), true);
    assert.equal(queryFromFind.user.$in.includes('friend-user'), true);
    assert.equal(queryFromFind.user.$in.includes(OTHER_ID), false);
    assert.equal(result.hasMore, true);
  });

  it('getExploreFeed should query only approved public posts from non-excluded users', async () => {
    let queryFromFind;
    postRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({
          blockedUsers: [OTHER_ID],
          mutedUsers: [],
        }),
      }),
    });
    postRepository.postFind = query => {
      queryFromFind = query;
      return makePopulateLeanChain([]);
    };
    PostService._addUserStatus = async posts => posts;

    const result = await PostService.getExploreFeed(USER_ID, { page: 1, limit: 1 });

    assert.equal(queryFromFind.visibility, 'public');
    assert.equal(queryFromFind['moderation.status'], 'approved');
    assert.equal(queryFromFind.user.$nin.includes(USER_ID), true);
    assert.equal(result.hasMore, false);
  });

  it('getHashtagFeed should include non-empty hashtag filter', async () => {
    let queryFromFind;
    postRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({ blockedUsers: [], mutedUsers: [] }),
      }),
    });
    postRepository.postFind = query => {
      queryFromFind = query;
      return makePopulateLeanChain([]);
    };
    PostService._addUserStatus = async posts => posts;

    await PostService.getHashtagFeed(USER_ID, { page: 1, limit: 20 });

    assert.equal(Array.isArray(queryFromFind.$and), true);
    assert.equal(queryFromFind.$and.length, 2);
  });

  it('getPersonalizedFeed should combine user interests and interaction hashtags', async () => {
    let feedQuery;
    postRepository.userFindById = () => ({
      select: () => ({
        lean: async () => ({ interests: ['Travel'] }),
      }),
    });
    postRepository.userInteractionFind = () =>
      makePopulateLeanChain([
        { targetType: 'post', targetId: 'post-interest' },
        { targetType: 'user', targetId: 'ignored' },
      ]);
    postRepository.postFind = query => {
      if (query._id) {
        return {
          select() {
            return this;
          },
          lean: async () => [{ hashtags: ['Nature'] }],
        };
      }
      feedQuery = query;
      return makePopulateLeanChain([{ _id: 'feed-item' }]);
    };
    postRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({ blockedUsers: [], mutedUsers: [] }),
      }),
    });
    PostService._addUserStatus = async posts => posts;

    await PostService.getPersonalizedFeed(USER_ID, { page: 1, limit: 2 });

    assert.equal(Array.isArray(feedQuery.hashtags.$in), true);
    assert.equal(feedQuery.hashtags.$in.includes('nature'), true);
    assert.equal(feedQuery.hashtags.$in.includes('travel'), true);
  });

  it('getPersonalizedFeed should omit hashtag filter when no interests are available', async () => {
    let feedQuery;
    postRepository.userFindById = () => ({
      select: () => ({
        lean: async () => ({ interests: [] }),
      }),
    });
    postRepository.userInteractionFind = () => makePopulateLeanChain([]);
    postRepository.postFind = query => {
      if (query._id) {
        return {
          select() {
            return this;
          },
          lean: async () => [],
        };
      }
      feedQuery = query;
      return makePopulateLeanChain([]);
    };
    postRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({ blockedUsers: [], mutedUsers: [] }),
      }),
    });
    PostService._addUserStatus = async posts => posts;

    await PostService.getPersonalizedFeed(USER_ID, { page: 1, limit: 5 });

    assert.equal('hashtags' in feedQuery, false);
  });

  it('getTrendingPosts should fallback timeframe to day for unknown values', async () => {
    let queryFromFind;
    postRepository.postFind = query => {
      queryFromFind = query;
      return makePopulateLeanChain([{ _id: 'trend-1' }]);
    };

    const result = await PostService.getTrendingPosts({
      timeframe: 'year',
      page: 1,
      limit: 2,
    });

    const ageMs = Date.now() - queryFromFind.createdAt.$gte.getTime();
    assert.equal(result.hasMore, false);
    assert.equal(ageMs > 0, true);
    assert.equal(ageMs < 2 * 24 * 60 * 60 * 1000, true);
  });

  it('searchPosts should work without user context and skip user status enrich', async () => {
    let searchQuery;
    postRepository.postFind = query => {
      searchQuery = query;
      return makePopulateLeanChain([{ _id: 'post-search' }]);
    };
    postRepository.postCountDocuments = async () => 2;
    PostService._addUserStatus = async () => {
      throw new Error('should not call _addUserStatus');
    };

    const result = await PostService.searchPosts('search me', null, { page: 1, limit: 1 });

    assert.equal(searchQuery.user.$nin.length, 0);
    assert.equal(result.hasMore, true);
  });

  it('getPostsByHashtag should work without user context', async () => {
    let queryFromFind;
    postRepository.hashtagFindOneAndUpdate = async () => ({});
    postRepository.postFind = query => {
      queryFromFind = query;
      return makePopulateLeanChain([{ _id: 'post-tag' }]);
    };
    postRepository.postCountDocuments = async () => 1;
    PostService._addUserStatus = async () => {
      throw new Error('should not call _addUserStatus');
    };

    const result = await PostService.getPostsByHashtag('#NodeJS', null, {
      page: 1,
      limit: 10,
    });

    assert.equal(queryFromFind.hashtags, 'nodejs');
    assert.equal(result.hasMore, false);
  });

  it('unlikePost should decrement likes count when like exists', async () => {
    let decremented = false;
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.likeFindOneAndDelete = () => ({
      session: async () => ({ _id: 'like-existing' }),
    });
    postRepository.postFindByIdAndUpdate = () => ({
      session: async () => {
        decremented = true;
        return {};
      },
    });

    const result = await PostService.unlikePost('post-like', USER_ID);

    assert.equal(result.success, true);
    assert.equal(decremented, true);
  });

  it('unlikePost should abort transaction when update step fails', async () => {
    let aborted = false;
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {
        aborted = true;
      },
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.likeFindOneAndDelete = () => ({
      session: async () => ({ _id: 'like' }),
    });
    postRepository.postFindByIdAndUpdate = () => ({
      session: async () => {
        throw new Error('update failed');
      },
    });

    await assert.rejects(PostService.unlikePost('post-like', USER_ID), /update failed/);
    assert.equal(aborted, true);
  });

  it('savePost should throw not found when target post does not exist', async () => {
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.postFindOne = () => ({
      session: async () => null,
    });

    await assert.rejects(
      PostService.savePost('post-missing', USER_ID),
      err => err?.statusCode === 404
    );
  });

  it('unsavePost should return success when save record does not exist', async () => {
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.savePostFindOneAndDelete = () => ({
      session: async () => null,
    });

    const result = await PostService.unsavePost('post-unsaved', USER_ID);

    assert.equal(result.wasNotSaved, true);
  });

  it('unsavePost should decrement saves count when save record exists', async () => {
    let decremented = false;
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.savePostFindOneAndDelete = () => ({
      session: async () => ({ _id: 'saved-entry' }),
    });
    postRepository.postFindByIdAndUpdate = () => ({
      session: async () => {
        decremented = true;
        return {};
      },
    });

    const result = await PostService.unsavePost('post-unsaved', USER_ID);

    assert.equal(result.success, true);
    assert.equal(decremented, true);
  });

  it('unsavePost should abort transaction when decrement fails', async () => {
    let aborted = false;
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {
        aborted = true;
      },
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.savePostFindOneAndDelete = () => ({
      session: async () => ({ _id: 'saved-entry' }),
    });
    postRepository.postFindByIdAndUpdate = () => ({
      session: async () => {
        throw new Error('decrement failed');
      },
    });

    await assert.rejects(PostService.unsavePost('post-unsaved', USER_ID), /decrement failed/);
    assert.equal(aborted, true);
  });

  it('likeComment should throw when comment does not exist', async () => {
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.commentFindOne = () => ({
      session: async () => null,
    });

    await assert.rejects(
      PostService.likeComment('comment-404', USER_ID),
      err => err?.statusCode === 404
    );
  });

  it('likeComment should create like when no existing like is found', async () => {
    let likeCreated = false;
    let incrementedComment = false;
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.commentFindOne = () => ({
      session: async () => ({ _id: 'comment-ok' }),
    });
    postRepository.likeFindOne = () => ({
      session: async () => null,
    });
    postRepository.likeCreate = async () => {
      likeCreated = true;
    };
    postRepository.commentFindByIdAndUpdate = () => ({
      session: async () => {
        incrementedComment = true;
        return {};
      },
    });

    const result = await PostService.likeComment('comment-ok', USER_ID);

    assert.equal(result.success, true);
    assert.equal(likeCreated, true);
    assert.equal(incrementedComment, true);
  });

  it('unlikeComment should decrement likes count when comment like exists', async () => {
    let decremented = false;
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.likeFindOneAndDelete = () => ({
      session: async () => ({ _id: 'like-comment' }),
    });
    postRepository.commentFindByIdAndUpdate = () => ({
      session: async () => {
        decremented = true;
        return {};
      },
    });

    const result = await PostService.unlikeComment('comment-ok', USER_ID);

    assert.equal(result.success, true);
    assert.equal(decremented, true);
  });

  it('unlikeComment should abort transaction when counter update fails', async () => {
    let aborted = false;
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {
        aborted = true;
      },
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.likeFindOneAndDelete = () => ({
      session: async () => ({ _id: 'like-comment' }),
    });
    postRepository.commentFindByIdAndUpdate = () => ({
      session: async () => {
        throw new Error('comment update failed');
      },
    });

    await assert.rejects(
      PostService.unlikeComment('comment-ok', USER_ID),
      /comment update failed/
    );
    assert.equal(aborted, true);
  });

  it('sharePost should skip notification when author shares own post', async () => {
    let notificationCalled = false;
    postRepository.postFindOne = async () => ({ _id: 'post-own', user: USER_ID });
    postRepository.postFindByIdAndUpdate = async () => ({});
    postRepository.userInteractionRecord = async () => ({});
    postRepository.notificationCreateNotification = async () => {
      notificationCalled = true;
    };

    const result = await PostService.sharePost('post-own', USER_ID);

    assert.equal(result.success, true);
    assert.equal(notificationCalled, false);
  });

  it('addComment should continue when notification creation fails asynchronously', async () => {
    postRepository.postFindOne = () =>
      makePopulateLeanChain({ _id: 'post-notify-fail', user: OTHER_ID });
    postRepository.commentCreate = async () => ({ _id: 'comment-notify-fail' });
    postRepository.userInteractionRecord = async () => ({});
    postRepository.userFindById = () =>
      makePopulateLeanChain({ username: 'alice' });
    postRepository.notificationCreateNotification = () =>
      Promise.reject(new Error('notify failed'));
    postRepository.commentFindById = () =>
      makePopulateLeanChain({ _id: 'comment-notify-fail' });

    const result = await PostService.addComment('post-notify-fail', USER_ID, 'hello');

    assert.equal(result._id, 'comment-notify-fail');
  });

  it('reportPost should throw when post does not exist', async () => {
    postRepository.postFindOne = async () => null;

    await assert.rejects(
      PostService.reportPost('post-404', USER_ID, 'spam'),
      err => err?.statusCode === 404
    );
  });

  it('uploadMedia should upload array files and map image/video metadata', async () => {
    const uploadCalls = [];
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    cloudinary.uploader.upload_stream = (options, cb) => {
      uploadCalls.push(options);
      return {
        end() {
          cb(null, {
            secure_url: `https://cdn.example/${options.publicId || options.public_id}`,
            public_id: options.publicId || options.public_id,
          });
        },
      };
    };

    const result = await PostService.uploadMedia(
      [
        {
          mimetype: 'image/png',
          originalname: 'photo.png',
          buffer: Buffer.from('img'),
        },
        {
          mimetype: 'video/mp4',
          originalname: 'clip.mp4',
          buffer: Buffer.from('vid'),
        },
      ],
      USER_ID
    );

    assert.equal(result.length, 2);
    assert.equal(result[0].type, 'image');
    assert.equal(result[1].type, 'video');
    assert.equal(uploadCalls.length, 2);
  });

  it('uploadMedia should normalize single file input into array', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    cloudinary.uploader.upload_stream = (options, cb) => ({
      end() {
        cb(null, {
          secure_url: 'https://cdn.example/one',
          public_id: options.publicId || options.public_id,
        });
      },
    });

    const result = await PostService.uploadMedia(
      {
        mimetype: 'image/jpeg',
        originalname: 'single.jpg',
        buffer: Buffer.from('single'),
      },
      USER_ID
    );

    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'image');
  });

  it('searchPosts should short-circuit for short query', async () => {
    const result = await PostService.searchPosts('a');

    assert.deepEqual(result, {
      posts: [],
      total: 0,
    });
  });

  it('getTrendingHashtags should delegate to repository with provided limit', async () => {
    const originalGetTrending = postRepository.hashtagGetTrending;
    let receivedLimit;

    postRepository.hashtagGetTrending = async limit => {
      receivedLimit = limit;
      return [{ name: 'javascript', score: 10 }];
    };

    try {
      const result = await PostService.getTrendingHashtags(15);

      assert.equal(receivedLimit, 15);
      assert.deepEqual(result, [{ name: 'javascript', score: 10 }]);
    } finally {
      postRepository.hashtagGetTrending = originalGetTrending;
    }
  });

  it('_addUserStatus should append isLiked/isSaved flags', async () => {
    postRepository.likeFind = () =>
      makePopulateLeanChain([{ post: 'post-1' }]);
    postRepository.savePostFind = () =>
      makePopulateLeanChain([{ post: 'post-2' }]);

    const result = await PostService._addUserStatus(
      [{ _id: 'post-1' }, { _id: 'post-2' }],
      USER_ID
    );

    assert.equal(result[0].isLiked, true);
    assert.equal(result[0].isSaved, false);
    assert.equal(result[1].isLiked, false);
    assert.equal(result[1].isSaved, true);
  });

  it('searchPosts should build search query and enrich with user status when userId is provided', async () => {
    let searchQuery;
    let addUserStatusCalled = false;

    postRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({
          blockedUsers: ['blocked-user'],
          mutedUsers: ['muted-user'],
        }),
      }),
    });
    postRepository.postFind = query => {
      searchQuery = query;
      return makePopulateLeanChain([{ _id: 'post-a' }]);
    };
    postRepository.postCountDocuments = async () => 3;
    PostService._addUserStatus = async posts => {
      addUserStatusCalled = true;
      return posts.map(item => ({ ...item, isLiked: true, isSaved: false }));
    };

    const result = await PostService.searchPosts(' #javascript ', USER_ID, {
      page: 2,
      limit: 1,
    });

    assert.equal(searchQuery.user.$nin.includes('blocked-user'), true);
    assert.equal(searchQuery.user.$nin.includes('muted-user'), true);
    assert.equal(addUserStatusCalled, true);
    assert.equal(result.posts[0].isLiked, true);
    assert.equal(result.hasMore, true);
  });

  it('getPostsByHashtag should normalize hashtag and apply user status', async () => {
    let hashtagUpdateArgs;
    let queryFromFind;

    postRepository.hashtagFindOneAndUpdate = async (...args) => {
      hashtagUpdateArgs = args;
      return {};
    };
    postRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({
          blockedUsers: ['blocked-user'],
          mutedUsers: [],
        }),
      }),
    });
    postRepository.postFind = query => {
      queryFromFind = query;
      return makePopulateLeanChain([{ _id: 'post-1' }]);
    };
    postRepository.postCountDocuments = async () => 2;
    PostService._addUserStatus = async posts => posts.map(p => ({ ...p, isSaved: true }));

    const result = await PostService.getPostsByHashtag('#NodeJS', USER_ID, {
      page: 1,
      limit: 1,
    });

    assert.equal(hashtagUpdateArgs[0].name, 'nodejs');
    assert.equal(queryFromFind.hashtags, 'nodejs');
    assert.equal(queryFromFind.user.$nin.includes('blocked-user'), true);
    assert.equal(result.posts[0].isSaved, true);
    assert.equal(result.hasMore, true);
  });

  it('getPostLikes should map likes to list of users', async () => {
    postRepository.likeFind = () =>
      makePopulateLeanChain([
        { user: { _id: USER_ID, username: 'me' } },
        { user: { _id: OTHER_ID, username: 'other' } },
      ]);

    const result = await PostService.getPostLikes('post-like', { page: 1, limit: 2 });
    assert.equal(result.length, 2);
    assert.equal(result[0].username, 'me');
  });

  it('getSavedPosts should filter deleted posts and map collection name', async () => {
    postRepository.savePostFind = () =>
      makePopulateLeanChain([
        {
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
          folder: 'favorites',
          post: { _id: 'post-1', caption: 'hello' },
        },
        {
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
          folder: 'favorites',
          post: null,
        },
      ]);

    const result = await PostService.getSavedPosts(USER_ID, {
      page: 1,
      limit: 1,
      collection: 'favorites',
    });

    assert.equal(result.posts.length, 1);
    assert.equal(result.posts[0].collection, 'favorites');
    assert.equal(result.hasMore, true);
  });

  it('getSavedCollections should delegate to repository', async () => {
    postRepository.savePostGetCollections = async () => ['default', 'favorites'];
    const result = await PostService.getSavedCollections(USER_ID);
    assert.deepEqual(result, ['default', 'favorites']);
  });

  it('getComments should normalize popular sort and compute hasMore', async () => {
    let receivedOptions;
    let countQuery;
    postRepository.commentGetCommentsForPost = async (_postId, options) => {
      receivedOptions = options;
      return [{ _id: 'comment-1' }];
    };
    postRepository.commentCountDocuments = async query => {
      countQuery = query;
      return 21;
    };

    const result = await PostService.getComments('post-1', {
      page: 1,
      limit: 20,
      sort: 'popular',
    });

    assert.equal(receivedOptions.sortBy, 'likesCount');
    assert.equal(countQuery.post, 'post-1');
    assert.equal(result.hasMore, true);
  });

  it('getCommentReplies should return hasMore when page is full', async () => {
    postRepository.commentFind = () =>
      makePopulateLeanChain([{ _id: 'reply-1' }, { _id: 'reply-2' }]);

    const result = await PostService.getCommentReplies('comment-1', {
      page: 1,
      limit: 2,
    });

    assert.equal(result.replies.length, 2);
    assert.equal(result.hasMore, true);
  });

  it('updateComment should reject unauthorized updates', async () => {
    postRepository.commentFindOne = async () => null;
    await assert.rejects(
      PostService.updateComment('comment-2', USER_ID, 'new content'),
      err => err?.statusCode === 403
    );
  });

  it('updateComment should trim content and return populated comment', async () => {
    let saved = false;
    const comment = {
      _id: 'comment-3',
      content: 'old',
      save: async () => {
        saved = true;
      },
    };
    postRepository.commentFindOne = async () => comment;
    postRepository.commentFindById = () =>
      makePopulateLeanChain({
        _id: 'comment-3',
        content: 'new content',
      });

    const result = await PostService.updateComment('comment-3', USER_ID, ' new content ');

    assert.equal(saved, true);
    assert.equal(comment.content, 'new content');
    assert.equal(comment.isEdited, true);
    assert.equal(result._id, 'comment-3');
  });

  it('sharePost should throw when post does not exist', async () => {
    postRepository.postFindOne = async () => null;
    await assert.rejects(
      PostService.sharePost('post-404', USER_ID),
      err => err?.statusCode === 404
    );
  });

  it('sharePost should increment share count and create notification', async () => {
    let interactionPayload;
    let notificationPayload;
    postRepository.postFindOne = async () => ({ _id: 'post-2', user: OTHER_ID });
    postRepository.postFindByIdAndUpdate = async () => ({});
    postRepository.userInteractionRecord = async payload => {
      interactionPayload = payload;
    };
    postRepository.userFindById = () => ({
      select: () => ({
        lean: async () => ({ username: 'alice' }),
      }),
    });
    postRepository.notificationCreateNotification = async payload => {
      notificationPayload = payload;
    };

    const result = await PostService.sharePost('post-2', USER_ID, 'internal');
    assert.equal(result.success, true);
    assert.equal(interactionPayload.interactionType, 'share');
    assert.equal(notificationPayload.recipient, OTHER_ID);
    assert.match(notificationPayload.content, /alice/);
  });

  it('reportPost should validate reason, duplicate report and create report', async () => {
    await assert.rejects(
      PostService.reportPost('post-3', USER_ID, 'invalid_reason'),
      err => err?.statusCode === 400
    );

    postRepository.postFindOne = async () => ({ _id: 'post-3', user: OTHER_ID });
    postRepository.reportFindOne = async () => ({ _id: 'existing-report' });
    await assert.rejects(
      PostService.reportPost('post-3', USER_ID, 'spam'),
      err => err?.statusCode === 409
    );

    postRepository.reportFindOne = async () => null;
    postRepository.reportCreate = async payload => payload;
    const created = await PostService.reportPost('post-3', USER_ID, 'fake_account', 'detail');

    assert.equal(created.category, 'impersonation');
    assert.equal(created.targetType, 'post');
    assert.equal(created.targetUser, OTHER_ID);
  });

  it('toggleLike should call likePost/unlikePost based on existing state', async () => {
    postRepository.likeFindOne = async () => null;
    let likeCalled = false;
    let unlikeCalled = false;
    PostService.likePost = async () => {
      likeCalled = true;
    };
    PostService.unlikePost = async () => {
      unlikeCalled = true;
    };

    const likedResult = await PostService.toggleLike('post-4', USER_ID);
    assert.equal(likedResult.liked, true);
    assert.equal(likeCalled, true);

    postRepository.likeFindOne = async () => ({ _id: 'existing-like' });
    const unlikedResult = await PostService.toggleLike('post-4', USER_ID);
    assert.equal(unlikedResult.liked, false);
    assert.equal(unlikeCalled, true);
  });

  it('likePost should return alreadyLiked when like exists', async () => {
    let committed = false;
    const session = {
      startTransaction() {},
      commitTransaction: async () => {
        committed = true;
      },
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.postFindOne = () => ({
      session: async () => ({ _id: 'post-5', user: OTHER_ID }),
    });
    postRepository.likeFindOne = () => ({
      session: async () => ({ _id: 'like-existing' }),
    });

    const result = await PostService.likePost('post-5', USER_ID);
    assert.equal(result.alreadyLiked, true);
    assert.equal(committed, true);
  });

  it('likePost should create like, interaction, and notification for post owner', async () => {
    let likeCreated = false;
    let notificationPayload;
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.postFindOne = () => ({
      session: async () => ({ _id: 'post-6', user: OTHER_ID }),
    });
    postRepository.likeFindOne = () => ({
      session: async () => null,
    });
    postRepository.likeCreate = async () => {
      likeCreated = true;
    };
    postRepository.postFindByIdAndUpdate = () => ({
      session: async () => ({}),
    });
    postRepository.userInteractionRecord = async () => ({});
    postRepository.userFindById = () =>
      makePopulateLeanChain({ username: 'alice' });
    postRepository.notificationCreateNotification = async payload => {
      notificationPayload = payload;
    };

    const result = await PostService.likePost('post-6', USER_ID);

    assert.equal(result.success, true);
    assert.equal(likeCreated, true);
    assert.equal(notificationPayload.recipient, OTHER_ID);
    assert.match(notificationPayload.content, /alice/);
  });

  it('likePost should abort transaction when post is not found', async () => {
    let aborted = false;
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {
        aborted = true;
      },
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.postFindOne = () => ({
      session: async () => null,
    });

    await assert.rejects(
      PostService.likePost('post-404', USER_ID),
      err => err?.statusCode === 404
    );
    assert.equal(aborted, true);
  });

  it('unlikePost should return wasNotLiked when like does not exist', async () => {
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.likeFindOneAndDelete = () => ({
      session: async () => null,
    });

    const result = await PostService.unlikePost('post-7', USER_ID);
    assert.equal(result.wasNotLiked, true);
  });

  it('savePost should update folder when already saved in another collection', async () => {
    let saveCalled = false;
    const existingSave = {
      folder: 'old-folder',
      save: async () => {
        saveCalled = true;
      },
    };
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.postFindOne = () => ({
      session: async () => ({ _id: 'post-8' }),
    });
    postRepository.savePostFindOne = () => ({
      session: async () => existingSave,
    });

    const result = await PostService.savePost('post-8', USER_ID, 'favorites');

    assert.equal(result.alreadySaved, true);
    assert.equal(existingSave.folder, 'favorites');
    assert.equal(saveCalled, true);
  });

  it('savePost should create saved post entry when it does not exist', async () => {
    let savePostCreated = false;
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.postFindOne = () => ({
      session: async () => ({ _id: 'post-9' }),
    });
    postRepository.savePostFindOne = () => ({
      session: async () => null,
    });
    postRepository.savePostCreate = async () => {
      savePostCreated = true;
    };
    postRepository.postFindByIdAndUpdate = () => ({
      session: async () => ({}),
    });
    postRepository.userInteractionRecord = async () => ({});

    const result = await PostService.savePost('post-9', USER_ID, 'default');
    assert.equal(result.success, true);
    assert.equal(savePostCreated, true);
  });

  it('addComment should validate post and parent comment existence', async () => {
    postRepository.postFindOne = () => ({
      lean: async () => null,
    });
    await assert.rejects(
      PostService.addComment('post-x', USER_ID, 'hi'),
      err => err?.statusCode === 404
    );

    postRepository.postFindOne = () =>
      makePopulateLeanChain({ _id: 'post-y', user: OTHER_ID });
    postRepository.commentFindById = () => ({
      lean: async () => null,
    });
    await assert.rejects(
      PostService.addComment('post-y', USER_ID, 'reply', 'parent-missing'),
      err => err?.statusCode === 404
    );
  });

  it('addComment should create reply and notify parent comment owner', async () => {
    let notifyPayload;
    let callIndex = 0;
    postRepository.postFindOne = () =>
      makePopulateLeanChain({ _id: 'post-z', user: OTHER_ID });
    postRepository.commentFindById = () => {
      callIndex += 1;
      if (callIndex === 1) {
        return makePopulateLeanChain({
          _id: 'parent-1',
          depth: 1,
          user: OTHER_ID,
        });
      }
      if (callIndex === 2) {
        return makePopulateLeanChain({ user: OTHER_ID });
      }
      return makePopulateLeanChain({ _id: 'comment-new', content: 'reply content' });
    };
    postRepository.commentCreate = async () => ({ _id: 'comment-new' });
    postRepository.userFindById = () =>
      makePopulateLeanChain({ username: 'alice' });
    postRepository.notificationCreateNotification = payload => {
      notifyPayload = payload;
      return Promise.resolve();
    };
    postRepository.userInteractionRecord = async () => ({});

    const result = await PostService.addComment(
      'post-z',
      USER_ID,
      'reply content',
      'parent-1'
    );

    assert.equal(result._id, 'comment-new');
    assert.equal(notifyPayload.recipient, OTHER_ID);
    assert.equal(notifyPayload.type, 'reply');
  });

  it('deleteComment should reject unauthorized user and support admin delete flow', async () => {
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => session;
    postRepository.commentFindOne = () => ({
      session: async () => null,
    });
    await assert.rejects(
      PostService.deleteComment('comment-x', USER_ID, false),
      err => err?.statusCode === 403
    );

    const comment = {
      _id: 'comment-y',
      post: 'post-y',
      parentComment: 'parent-y',
      save: async () => {},
    };
    postRepository.commentFindOne = () => ({
      session: async () => comment,
    });
    postRepository.postFindByIdAndUpdate = () => ({
      session: async () => ({}),
    });
    postRepository.commentFindByIdAndUpdate = () => ({
      session: async () => ({}),
    });

    const result = await PostService.deleteComment('comment-y', USER_ID, true);
    assert.equal(result._id, 'comment-y');
    assert.equal(comment.isDeleted, true);
  });

  it('likeComment/unlikeComment should return idempotent responses', async () => {
    const session = {
      startTransaction() {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession() {},
    };
    mongoose.startSession = async () => session;

    postRepository.commentFindOne = () => ({
      session: async () => ({ _id: 'comment-like' }),
    });
    postRepository.likeFindOne = () => ({
      session: async () => ({ _id: 'like-comment' }),
    });
    const likeResult = await PostService.likeComment('comment-like', USER_ID);
    assert.equal(likeResult.alreadyLiked, true);

    postRepository.likeFindOneAndDelete = () => ({
      session: async () => null,
    });
    const unlikeResult = await PostService.unlikeComment('comment-like', USER_ID);
    assert.equal(unlikeResult.wasNotLiked, true);
  });

  it('_processHashtags should return empty array when caption has no hashtags', async () => {
    const result = await PostService._processHashtags('no hashtag here', null);
    assert.deepEqual(result, []);
  });
});

