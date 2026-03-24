import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import Follow from '../../../src/models/Follow.js';
import Like from '../../../src/models/Like.js';
import SavePost from '../../../src/models/SavePost.js';
import User from '../../../src/models/User.js';
import UserInteraction from '../../../src/models/UserInteraction.js';
import Post from '../../../src/models/Post.js';
import Comment from '../../../src/models/Comment.js';
import { createQueryChain } from '../../shared/modelTestUtils.js';

const USER_ID = '507f191e810c19729de860ea';
const OTHER_USER_ID = '507f191e810c19729de860eb';
const THIRD_USER_ID = '507f191e810c19729de860ec';
const POST_ID = '507f191e810c19729de860ed';
const COMMENT_ID = '507f191e810c19729de860ee';
const REQUEST_ID = '507f191e810c19729de860ef';

const originals = {
  Follow: {
    findOne: Follow.findOne,
    findByIdAndUpdate: Follow.findByIdAndUpdate,
    create: Follow.create,
    findOneAndDelete: Follow.findOneAndDelete,
    findOneAndUpdate: Follow.findOneAndUpdate,
    find: Follow.find,
    exists: Follow.exists,
    aggregate: Follow.aggregate,
    updateOne: Follow.updateOne,
  },
  Like: {
    create: Like.create,
    deleteOne: Like.deleteOne,
    findOneAndDelete: Like.findOneAndDelete,
    findOne: Like.findOne,
    find: Like.find,
  },
  SavePost: {
    updateOne: SavePost.updateOne,
    findOne: SavePost.findOne,
    deleteOne: SavePost.deleteOne,
    findOneAndDelete: SavePost.findOneAndDelete,
    find: SavePost.find,
    aggregate: SavePost.aggregate,
  },
  User: {
    findById: User.findById,
    updateOne: User.updateOne,
  },
  UserInteraction: {
    record: UserInteraction.record,
  },
  Post: {
    findByIdAndUpdate: Post.findByIdAndUpdate,
    updateOne: Post.updateOne,
  },
  Comment: {
    findByIdAndUpdate: Comment.findByIdAndUpdate,
    updateOne: Comment.updateOne,
  },
};

afterEach(() => {
  Object.assign(Follow, originals.Follow);
  Object.assign(Like, originals.Like);
  Object.assign(SavePost, originals.SavePost);
  Object.assign(User, originals.User);
  Object.assign(UserInteraction, originals.UserInteraction);
  Object.assign(Post, originals.Post);
  Object.assign(Comment, originals.Comment);
});

describe('models/Follow', () => {
  it('follow should reject self-follow, missing users, and duplicate active/pending states', async () => {
    assert.deepEqual(await Follow.follow(USER_ID, USER_ID), {
      success: false,
      error: 'Cannot follow yourself',
    });

    User.findById = () => createQueryChain(null);
    assert.deepEqual(await Follow.follow(USER_ID, OTHER_USER_ID), {
      success: false,
      error: 'User not found',
    });

    User.findById = () =>
      createQueryChain({ privacy: { profileVisibility: 'public' } });
    Follow.findOne = () => createQueryChain({ status: 'active' });
    assert.deepEqual(await Follow.follow(USER_ID, OTHER_USER_ID), {
      success: false,
      error: 'Already following',
    });

    Follow.findOne = () => createQueryChain({ status: 'pending' });
    assert.deepEqual(await Follow.follow(USER_ID, OTHER_USER_ID), {
      success: false,
      error: 'Follow request pending',
    });
  });

  it('follow should create active follows, update counters, and record interactions', async () => {
    const updates = [];
    const records = [];

    User.findById = () =>
      createQueryChain({ privacy: { profileVisibility: 'public' } });
    Follow.findOne = () => createQueryChain(null);
    Follow.create = async docs => [{ _id: 'follow-1', ...docs[0] }];
    User.updateOne = async (...args) => {
      updates.push(args);
      return { acknowledged: true };
    };
    UserInteraction.record = async (...args) => {
      records.push(args);
    };

    const result = await Follow.follow(USER_ID, OTHER_USER_ID, { session: 'tx-1' });

    assert.equal(result.success, true);
    assert.equal(result.status, 'active');
    assert.equal(result.follow._id, 'follow-1');
    assert.equal(updates.length, 2);
    assert.equal(records.length, 1);
    assert.equal(records[0][0].interactionType, 'follow');
    assert.equal(records[0][0].targetId, OTHER_USER_ID);
    assert.deepEqual(records[0][1], { session: 'tx-1' });
  });

  it('follow should create pending requests for private users and handle duplicate-race updates', async () => {
    User.findById = () =>
      createQueryChain({ privacy: { profileVisibility: 'private' } });
    Follow.findOne = () => createQueryChain(null);
    Follow.create = async docs => [{ _id: 'follow-pending', ...docs[0] }];

    let pendingResult = await Follow.follow(USER_ID, OTHER_USER_ID);
    assert.equal(pendingResult.success, true);
    assert.equal(pendingResult.status, 'pending');

    let findOneCalls = 0;
    let updatedDoc = null;

    User.findById = () =>
      createQueryChain({ privacy: { profileVisibility: 'public' } });
    User.updateOne = async () => ({ acknowledged: true });
    UserInteraction.record = async () => {};
    Follow.findOne = () =>
      createQueryChain(
        ++findOneCalls === 1 ? null : { _id: 'follow-race', status: 'rejected' }
      );
    Follow.create = async () => {
      const error = new Error('duplicate');
      error.code = 11000;
      throw error;
    };
    Follow.findByIdAndUpdate = async (id, update) => {
      updatedDoc = { _id: id, status: update.status };
      return updatedDoc;
    };

    const result = await Follow.follow(USER_ID, OTHER_USER_ID);

    assert.equal(result.success, true);
    assert.equal(result.status, 'active');
    assert.deepEqual(result.follow, { _id: 'follow-race', status: 'active' });
    assert.deepEqual(updatedDoc, { _id: 'follow-race', status: 'active' });
  });

  it('unfollow should handle missing and active follows correctly', async () => {
    Follow.findOneAndDelete = () => createQueryChain(null);
    assert.deepEqual(await Follow.unfollow(USER_ID, OTHER_USER_ID), {
      success: false,
      error: 'Not following',
    });

    const updates = [];
    const records = [];

    Follow.findOneAndDelete = () => createQueryChain({ status: 'active' });
    User.updateOne = async (...args) => {
      updates.push(args);
      return { acknowledged: true };
    };
    UserInteraction.record = async (...args) => {
      records.push(args);
    };

    const result = await Follow.unfollow(USER_ID, OTHER_USER_ID, { session: 'tx-2' });

    assert.deepEqual(result, { success: true });
    assert.equal(updates.length, 2);
    assert.equal(records.length, 1);
    assert.equal(records[0][0].interactionType, 'unfollow');
  });

  it('acceptFollowRequest and rejectFollowRequest should support fallback by request id', async () => {
    const followDoc = { follower: USER_ID, following: OTHER_USER_ID };
    const updateCalls = [];
    const userUpdates = [];

    let acceptCalls = 0;
    Follow.findOneAndUpdate = (...args) => {
      updateCalls.push(args);
      acceptCalls += 1;
      return acceptCalls === 1 ? null : followDoc;
    };
    User.updateOne = async (...args) => {
      userUpdates.push(args);
      return { acknowledged: true };
    };

    const accepted = await Follow.acceptFollowRequest(OTHER_USER_ID, REQUEST_ID, {
      session: 'tx-3',
    });

    assert.equal(accepted.success, true);
    assert.equal(updateCalls.length, 2);
    assert.equal(userUpdates.length, 2);
    assert.equal(updateCalls[0][0].follower, REQUEST_ID);
    assert.equal(updateCalls[1][0]._id, REQUEST_ID);

    Follow.findOneAndUpdate = () => null;
    assert.deepEqual(await Follow.rejectFollowRequest(OTHER_USER_ID, REQUEST_ID), {
      success: false,
      error: 'Follow request not found',
    });

    let rejectCalls = 0;
    Follow.findOneAndUpdate = (...args) => {
      rejectCalls += 1;
      return rejectCalls === 1 ? null : { _id: 'follow-reject', status: 'rejected' };
    };

    const rejected = await Follow.rejectFollowRequest(OTHER_USER_ID, REQUEST_ID);
    assert.equal(rejected.success, true);
    assert.equal(rejected.follow.status, 'rejected');
  });

  it('follow helper statics should shape ids, lists, aggregates, and updates', async () => {
    const findResponses = [
      createQueryChain([{ following: OTHER_USER_ID }, { following: THIRD_USER_ID }]),
      createQueryChain([{ follower: USER_ID }]),
      {
        sort() {
          return this;
        },
        skip() {
          return this;
        },
        limit() {
          return this;
        },
        populate() {
          return this;
        },
        lean: async () => [
          { follower: { username: 'alpha' } },
          { follower: null },
        ],
        then(resolve, reject) {
          return Promise.resolve([
            { follower: { username: 'alpha' } },
            { follower: null },
          ]).then(resolve, reject);
        },
      },
      {
        sort() {
          return this;
        },
        skip() {
          return this;
        },
        limit() {
          return this;
        },
        populate() {
          return this;
        },
        lean: async () => [
          { following: { username: 'beta' } },
          { following: null },
        ],
        then(resolve, reject) {
          return Promise.resolve([
            { following: { username: 'beta' } },
            { following: null },
          ]).then(resolve, reject);
        },
      },
      {
        sort() {
          return this;
        },
        limit() {
          return this;
        },
        select() {
          return this;
        },
        lean: async () => [
          { following: OTHER_USER_ID, interactionScore: 9 },
          { following: THIRD_USER_ID, interactionScore: 3 },
        ],
        then(resolve, reject) {
          return Promise.resolve([
            { following: OTHER_USER_ID, interactionScore: 9 },
            { following: THIRD_USER_ID, interactionScore: 3 },
          ]).then(resolve, reject);
        },
      },
      {
        sort() {
          return this;
        },
        skip() {
          return this;
        },
        limit() {
          return this;
        },
        populate() {
          return this;
        },
        lean: async () => [{ follower: { username: 'pending-user' } }],
      },
      {
        populate() {
          return this;
        },
        lean: async () => [
          { following: { username: 'close-friend' } },
          { following: { username: 'bestie' } },
        ],
        then(resolve, reject) {
          return Promise.resolve([
            { following: { username: 'close-friend' } },
            { following: { username: 'bestie' } },
          ]).then(resolve, reject);
        },
      },
    ];

    Follow.find = () => findResponses.shift();

    let existsQuery = null;
    let aggregatePipeline = null;
    let updateQuery = null;
    let updatePayload = null;

    Follow.exists = async query => {
      existsQuery = query;
      return { _id: 'exists-1' };
    };
    Follow.findOne = () => createQueryChain({ status: 'pending' });
    Follow.aggregate = async pipeline => {
      aggregatePipeline = pipeline;
      return [{ username: 'mutual' }];
    };
    Follow.updateOne = async (query, update) => {
      updateQuery = query;
      updatePayload = update;
      return { acknowledged: true };
    };

    assert.deepEqual(await Follow.getFollowingIds(USER_ID), [OTHER_USER_ID, THIRD_USER_ID]);
    assert.deepEqual(await Follow.getFollowerIds(OTHER_USER_ID), [USER_ID]);
    assert.deepEqual(await Follow.getFollowers(OTHER_USER_ID), [{ username: 'alpha' }]);
    assert.deepEqual(await Follow.getFollowing(USER_ID), [{ username: 'beta' }]);
    assert.deepEqual(await Follow.getFollowingForFeed(USER_ID, 5), [
      { userId: OTHER_USER_ID, score: 9 },
      { userId: THIRD_USER_ID, score: 3 },
    ]);
    assert.equal(await Follow.isFollowing(USER_ID, OTHER_USER_ID), true);
    assert.deepEqual(existsQuery, {
      follower: USER_ID,
      following: OTHER_USER_ID,
      status: 'active',
    });
    assert.equal(await Follow.getFollowStatus(USER_ID, OTHER_USER_ID), 'pending');
    assert.deepEqual(await Follow.getMutualFollowers(USER_ID, OTHER_USER_ID, 3), [
      { username: 'mutual' },
    ]);
    assert.ok(Array.isArray(aggregatePipeline));
    await Follow.updateInteractionScore(USER_ID, OTHER_USER_ID, 4);
    assert.equal(updateQuery.follower, USER_ID);
    assert.equal(updatePayload.$inc.interactionScore, 4);
    assert.ok(updatePayload.$set.lastInteractionAt instanceof Date);
    assert.deepEqual(await Follow.getPendingRequests(USER_ID), [
      { follower: { username: 'pending-user' } },
    ]);
    assert.deepEqual(await Follow.getCloseFriends(USER_ID), [
      { username: 'close-friend' },
      { username: 'bestie' },
    ]);
    await Follow.setCloseFriend(USER_ID, OTHER_USER_ID, true);
    assert.deepEqual(updatePayload, { $set: { isCloseFriend: true } });
  });
});

describe('models/Like', () => {
  it('likePost should handle duplicates, missing posts, and successful likes', async () => {
    Like.create = async () => {
      const error = new Error('duplicate');
      error.code = 11000;
      throw error;
    };

    assert.deepEqual(await Like.likePost(USER_ID, POST_ID), {
      success: false,
      message: 'Already liked',
      alreadyLiked: true,
    });

    let deletedArgs = null;
    Like.create = async docs => [{ _id: 'like-1', ...docs[0] }];
    Like.deleteOne = async (...args) => {
      deletedArgs = args;
      return { deletedCount: 1 };
    };
    Post.findByIdAndUpdate = async () => null;

    assert.deepEqual(await Like.likePost(USER_ID, POST_ID), {
      success: false,
      message: 'Post not found',
    });
    assert.deepEqual(deletedArgs[0], { _id: 'like-1' });

    let recordArgs = null;
    Post.findByIdAndUpdate = async () => ({
      user: OTHER_USER_ID,
      hashtags: ['one', 'two'],
    });
    UserInteraction.record = async (...args) => {
      recordArgs = args;
    };

    const success = await Like.likePost(USER_ID, POST_ID, { session: 'tx-4' });
    assert.equal(success.success, true);
    assert.equal(success.like._id, 'like-1');
    assert.equal(recordArgs[0].interactionType, 'like');
    assert.deepEqual(recordArgs[1], { session: 'tx-4' });
  });

  it('unlikePost should handle missing likes and successful unlikes', async () => {
    Like.findOneAndDelete = () => createQueryChain(null);
    assert.deepEqual(await Like.unlikePost(USER_ID, POST_ID), {
      success: false,
      message: 'Like not found',
    });

    let postUpdateArgs = null;
    let recordArgs = null;

    Like.findOneAndDelete = () => createQueryChain({ _id: 'like-1' });
    Post.updateOne = async (...args) => {
      postUpdateArgs = args;
      return { acknowledged: true };
    };
    UserInteraction.record = async (...args) => {
      recordArgs = args;
    };

    assert.deepEqual(await Like.unlikePost(USER_ID, POST_ID), { success: true });
    assert.equal(postUpdateArgs[0]._id, POST_ID);
    assert.equal(recordArgs[0].interactionType, 'unlike');
  });

  it('comment like statics and lookup helpers should work for both target types', async () => {
    Like.create = async docs => [{ _id: 'comment-like-1', ...docs[0] }];
    Comment.findByIdAndUpdate = async () => null;
    Like.deleteOne = async () => ({ deletedCount: 1 });

    assert.deepEqual(await Like.likeComment(USER_ID, COMMENT_ID), {
      success: false,
      message: 'Comment not found',
    });

    Comment.findByIdAndUpdate = async () => ({ _id: COMMENT_ID });
    const likedComment = await Like.likeComment(USER_ID, COMMENT_ID);
    assert.equal(likedComment.success, true);
    assert.equal(likedComment.like.targetType, 'comment');

    Like.findOneAndDelete = () => createQueryChain(null);
    assert.deepEqual(await Like.unlikeComment(USER_ID, COMMENT_ID), {
      success: false,
      message: 'Like not found',
    });

    let commentUpdateArgs = null;
    Like.findOneAndDelete = () => createQueryChain({ _id: 'comment-like-1' });
    Comment.updateOne = async (...args) => {
      commentUpdateArgs = args;
      return { acknowledged: true };
    };
    assert.deepEqual(await Like.unlikeComment(USER_ID, COMMENT_ID), { success: true });
    assert.equal(commentUpdateArgs[0]._id, COMMENT_ID);

    Like.findOne = query => createQueryChain(query.targetType === 'post' ? { _id: 'post-like' } : null);
    assert.equal(await Like.hasLiked(USER_ID, POST_ID, 'post'), true);
    assert.equal(await Like.hasLiked(USER_ID, COMMENT_ID, 'comment'), false);

    Like.find = query => ({
      sort() {
        return this;
      },
      skip() {
        return this;
      },
      limit() {
        return this;
      },
      populate() {
        return this;
      },
      select() {
        return this;
      },
      lean: async () =>
        query.post
          ? [
              { user: { username: 'liker-1' }, post: POST_ID },
              { user: { username: 'liker-2' }, post: OTHER_USER_ID },
            ]
          : [{ user: { username: 'comment-liker' }, comment: COMMENT_ID }],
      then(resolve, reject) {
        return Promise.resolve(
          query.post
            ? [
                { user: { username: 'liker-1' }, post: POST_ID },
                { user: { username: 'liker-2' }, post: OTHER_USER_ID },
              ]
            : [{ user: { username: 'comment-liker' }, comment: COMMENT_ID }]
        ).then(resolve, reject);
      },
    });

    assert.equal((await Like.getLikers(POST_ID, 'post')).length, 2);
    assert.equal((await Like.getLikers(COMMENT_ID, 'comment'))[0].user.username, 'comment-liker');
    assert.deepEqual(await Like.hasLikedMany(USER_ID, [POST_ID, OTHER_USER_ID, THIRD_USER_ID]), {
      [POST_ID]: true,
      [OTHER_USER_ID]: true,
      [THIRD_USER_ID]: false,
    });
  });
});

describe('models/SavePost', () => {
  it('legacy collection field should hydrate into folder', () => {
    const raw = {
      user: USER_ID,
      post: POST_ID,
      collection: 'favorites',
    };
    const initHook = SavePost.schema.s.hooks._pres.get('init')[0].fn;

    initHook(() => {}, raw);

    assert.equal(raw.folder, 'favorites');
  });

  it('savePost should detect no-op saves, update folders, and create saves with interaction tracking', async () => {
    SavePost.updateOne = async () => ({ modifiedCount: 0, upsertedCount: 0 });
    assert.deepEqual(await SavePost.savePost(USER_ID, POST_ID, 'default'), {
      success: false,
      message: 'Already saved',
    });

    SavePost.updateOne = async () => ({ modifiedCount: 1, upsertedCount: 0 });
    SavePost.findOne = () => createQueryChain({ _id: 'save-updated', folder: 'archive' });
    let result = await SavePost.savePost(USER_ID, POST_ID, 'archive');
    assert.equal(result.success, true);
    assert.equal(result.updated, true);
    assert.equal(result.save.folder, 'archive');

    let deletedArgs = null;
    let recordArgs = null;
    SavePost.updateOne = async () => ({ modifiedCount: 0, upsertedCount: 1, upsertedId: 'new-save' });
    SavePost.findOne = () => createQueryChain({ _id: 'save-new', folder: 'default' });
    SavePost.deleteOne = async (...args) => {
      deletedArgs = args;
      return { deletedCount: 1 };
    };
    Post.findByIdAndUpdate = async () => null;

    assert.deepEqual(await SavePost.savePost(USER_ID, POST_ID), {
      success: false,
      message: 'Post not found',
    });
    assert.deepEqual(deletedArgs[0], { _id: 'save-new' });

    Post.findByIdAndUpdate = async () => ({
      user: OTHER_USER_ID,
      hashtags: ['saved'],
    });
    UserInteraction.record = async (...args) => {
      recordArgs = args;
    };

    result = await SavePost.savePost(USER_ID, POST_ID, 'default', { session: 'tx-5' });
    assert.equal(result.success, true);
    assert.equal(result.updated, false);
    assert.equal(recordArgs[0].interactionType, 'save');
    assert.deepEqual(recordArgs[1], { session: 'tx-5' });
  });

  it('savePost should surface missing save documents and unsave/get helpers should work', async () => {
    SavePost.updateOne = async () => ({ modifiedCount: 1, upsertedCount: 0 });
    SavePost.findOne = () => createQueryChain(null);

    assert.deepEqual(await SavePost.savePost(USER_ID, POST_ID, 'archive'), {
      success: false,
      message: 'Save not found',
    });

    SavePost.findOneAndDelete = () => createQueryChain(null);
    assert.deepEqual(await SavePost.unsavePost(USER_ID, POST_ID), {
      success: false,
      message: 'Save not found',
    });

    let postUpdateArgs = null;
    let recordArgs = null;

    SavePost.findOneAndDelete = () => createQueryChain({ _id: 'save-new' });
    Post.updateOne = async (...args) => {
      postUpdateArgs = args;
      return { acknowledged: true };
    };
    UserInteraction.record = async (...args) => {
      recordArgs = args;
    };

    assert.deepEqual(await SavePost.unsavePost(USER_ID, POST_ID, { session: 'tx-6' }), {
      success: true,
    });
    assert.equal(postUpdateArgs[0]._id, POST_ID);
    assert.equal(recordArgs[0].interactionType, 'unsave');

    SavePost.find = query => ({
      sort() {
        return this;
      },
      skip() {
        return this;
      },
      limit() {
        return this;
      },
      populate() {
        return this;
      },
      select() {
        return this;
      },
      lean: async () =>
        query.post
          ? [{ post: POST_ID }, { post: OTHER_USER_ID }]
          : [
              { post: { _id: POST_ID, title: 'visible' }, folder: 'archive' },
              { post: null, folder: 'archive' },
            ],
      then(resolve, reject) {
        return Promise.resolve(
          query.post
            ? [{ post: POST_ID }, { post: OTHER_USER_ID }]
            : [
                { post: { _id: POST_ID, title: 'visible' }, folder: 'archive' },
                { post: null, folder: 'archive' },
              ]
        ).then(resolve, reject);
      },
    });
    SavePost.aggregate = async pipeline => {
      assert.equal(pipeline[0].$match.user.toString(), USER_ID);
      return [{ name: 'archive', count: 2 }];
    };
    SavePost.findOne = query => createQueryChain(query.post === POST_ID ? { _id: 'save-1' } : null);

    assert.deepEqual(await SavePost.getSavedPosts(USER_ID, { collection: 'archive' }), [
      { post: { _id: POST_ID, title: 'visible' }, folder: 'archive' },
    ]);
    assert.deepEqual(await SavePost.getCollections(USER_ID), [{ name: 'archive', count: 2 }]);
    assert.equal(await SavePost.hasSaved(USER_ID, POST_ID), true);
    assert.equal(await SavePost.hasSaved(USER_ID, OTHER_USER_ID), false);
    assert.deepEqual(await SavePost.hasSavedMany(USER_ID, [POST_ID, OTHER_USER_ID, THIRD_USER_ID]), {
      [POST_ID]: true,
      [OTHER_USER_ID]: true,
      [THIRD_USER_ID]: false,
    });
  });
});
