import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import Post from '../../../src/models/Post.js';
import User from '../../../src/models/User.js';
import Hashtag from '../../../src/models/Hashtag.js';
import Follow from '../../../src/models/Follow.js';
import UserSettings from '../../../src/models/UserSettings.js';
import { createQueryChain, runSchemaPreHook } from '../../shared/modelTestUtils.js';

const USER_ID = '507f191e810c19729de860ea';
const OTHER_USER_ID = '507f191e810c19729de860eb';
const THIRD_USER_ID = '507f191e810c19729de860ec';

const originals = {
  Post: {
    find: Post.find,
    aggregate: Post.aggregate,
  },
  User: {
    findById: User.findById,
    aggregate: User.aggregate,
  },
  Hashtag: {
    find: Hashtag.find,
    findOne: Hashtag.findOne,
    create: Hashtag.create,
    bulkWrite: Hashtag.bulkWrite,
    updateMany: Hashtag.updateMany,
  },
  Follow: {
    find: Follow.find,
  },
  UserSettings: {
    findOne: UserSettings.findOne,
  },
};

afterEach(() => {
  Object.assign(Post, originals.Post);
  Object.assign(User, originals.User);
  Object.assign(Hashtag, originals.Hashtag);
  Object.assign(Follow, originals.Follow);
  Object.assign(UserSettings, originals.UserSettings);
});

describe('models/Post', () => {
  it('post score methods should calculate engagement, trending, quality, and update aggregate scores', () => {
    const createdAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const post = new Post({
      user: USER_ID,
      caption: 'A'.repeat(200),
      media: [{ url: 'https://example.com/image.jpg', type: 'image' }],
      hashtags: ['travel', 'food'],
      location: { name: 'Bangkok' },
      likesCount: 10,
      commentsCount: 2,
      savesCount: 1,
      sharesCount: 1,
      createdAt,
    });

    assert.equal(post.calculateEngagementScore(), 12.5);
    assert.equal(post.calculateQualityScore(), 65);
    const trendingScore = post.calculateTrendingScore();
    assert.ok(trendingScore > 0);

    const updated = post.updateAllScores();
    assert.equal(updated, post);
    assert.ok(post.lastEngagedAt instanceof Date);
    assert.ok(post.engagementScore > 0);
    assert.ok(post.trendingScore > 0);
    assert.equal(post.qualityScore, 65);
  });

  it('getFeedForUser should build query and sort using the requested algorithm', async () => {
    const capturedQueries = [];
    const capturedSorts = [];

    Follow.find = () => createQueryChain([{ following: OTHER_USER_ID }]);
    UserSettings.findOne = () =>
      createQueryChain({ blockedUsers: [THIRD_USER_ID], mutedUsers: [] });
    Post.find = query => {
      capturedQueries.push(query);
      return {
        sort(sort) {
          capturedSorts.push(sort);
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
        lean: async () => [{ _id: 'post-1' }],
      };
    };

    const engagementFeed = await Post.getFeedForUser(USER_ID, {
      algorithm: 'engagement',
      page: 2,
      limit: 5,
    });
    const trendingFeed = await Post.getFeedForUser(USER_ID, {
      algorithm: 'trending',
      page: 1,
      limit: 3,
    });
    const chronologicalFeed = await Post.getFeedForUser(USER_ID);

    assert.deepEqual(engagementFeed, [{ _id: 'post-1' }]);
    assert.deepEqual(trendingFeed, [{ _id: 'post-1' }]);
    assert.deepEqual(chronologicalFeed, [{ _id: 'post-1' }]);
    assert.deepEqual(capturedSorts, [
      { engagementScore: -1, createdAt: -1 },
      { trendingScore: -1, createdAt: -1 },
      { createdAt: -1 },
    ]);
    assert.equal(capturedQueries[0].user.$in.includes(USER_ID), true);
    assert.equal(capturedQueries[0].user.$in.includes(OTHER_USER_ID), true);
    assert.deepEqual(capturedQueries[0].user.$nin, [THIRD_USER_ID]);
  });

  it('getExplorePost should return aggregated posts and adapt match rules for location or interests', async () => {
    const pipelines = [];

    UserSettings.findOne = () =>
      createQueryChain({ blockedUsers: [THIRD_USER_ID], mutedUsers: [] });
    Post.aggregate = async pipeline => {
      pipelines.push(pipeline);
      return [{ _id: 'explore-1' }];
    };

    User.findById = () =>
      createQueryChain({ interests: ['travel'], location: 'Bangkok' });
    let result = await Post.getExplorePost(USER_ID, { page: 1, limit: 4 });
    assert.deepEqual(result, [{ _id: 'explore-1' }]);
    assert.equal(pipelines[0][0].$match.user.$nin[0], USER_ID);
    assert.deepEqual(pipelines[0][1].$addFields.interestMatch.$size.$setIntersection[1], [
      'travel',
    ]);

    User.findById = () =>
      createQueryChain({ interests: ['travel', 'food'], location: '' });
    result = await Post.getExplorePost(USER_ID, { page: 2, limit: 2 });
    assert.deepEqual(result, [{ _id: 'explore-1' }]);
    assert.deepEqual(pipelines[1][0].$match.user.$nin, [USER_ID, THIRD_USER_ID]);
    assert.deepEqual(pipelines[1][1].$addFields.interestMatch.$size.$setIntersection[1], [
      'travel',
      'food',
    ]);
  });

  it('post pre-save hook should extract hashtags and initialize quality score for new posts', async () => {
    const post = new Post({
      user: USER_ID,
      caption: 'Hello #Travel #Food #travel',
      media: [{ url: 'https://example.com/image.jpg', type: 'image' }],
    });

    await runSchemaPreHook(Post, 'save', post);

    assert.deepEqual(post.hashtags, ['travel', 'food']);
    assert.ok(post.qualityScore > 0);
  });
});

describe('models/User', () => {
  it('user methods should calculate activity score and refresh engagement metrics from posts', async () => {
    const user = new User({
      username: 'tester',
      email: 'tester@example.com',
      password: 'secret',
      followersCount: 99,
      lastActiveAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      metrics: { engagementRate: 2.5 },
    });
    const originalSave = user.save;

    Post.aggregate = async () => [
      {
        totalLikes: 20,
        totalComments: 10,
        totalSaves: 5,
        postCount: 5,
        avgEngagement: 12.345,
      },
    ];
    user.save = async function () {
      return this;
    };

    const activityScore = user.calculateActivityScore();
    assert.ok(activityScore > 0);

    const updated = await user.updateEngagementMetrics();
    assert.equal(updated, user);
    assert.equal(user.postsCount, 5);
    assert.equal(user.metrics.totalLikesReceived, 20);
    assert.equal(user.metrics.totalCommentsReceived, 10);
    assert.equal(user.metrics.totalSavesReceived, 5);
    assert.equal(user.metrics.engagementRate, 7);
    assert.equal(user.metrics.avgPostEngagement, 12.35);
    assert.ok(user.metrics.lastCalculated instanceof Date);

    Post.aggregate = async () => [];
    await user.updateEngagementMetrics();
    assert.equal(user.postsCount, 5);

    user.save = originalSave;
  });

  it('getRecommendedUsers should return empty when the source user is missing', async () => {
    User.findById = () => createQueryChain(null);

    assert.deepEqual(await User.getRecommendedUsers(USER_ID, 5), []);
  });

  it('getRecommendedUsers should build aggregation based on location or interests', async () => {
    const pipelines = [];

    Follow.find = () => createQueryChain([{ following: OTHER_USER_ID }]);
    User.aggregate = async pipeline => {
      pipelines.push(pipeline);
      return [{ username: 'recommended' }];
    };

    User.findById = () =>
      createQueryChain({ interests: ['travel'], location: 'Bangkok' });
    let result = await User.getRecommendedUsers(USER_ID, 3);
    assert.deepEqual(result, [{ username: 'recommended' }]);
    assert.equal(pipelines[0][0].$match.location, 'Bangkok');
    assert.equal(pipelines[0][0].$match._id.$nin[0], OTHER_USER_ID);

    User.findById = () =>
      createQueryChain({ interests: ['travel', 'food'], location: '' });
    result = await User.getRecommendedUsers(USER_ID, 4);
    assert.deepEqual(result, [{ username: 'recommended' }]);
    assert.deepEqual(pipelines[1][0].$match.interests, { $in: ['travel', 'food'] });
    assert.equal(pipelines[1][1].$addFields.locationMatch.$cond.then, 1);
  });
});

describe('models/Hashtag', () => {
  it('hashtag methods should increment usage, track peaks, and compute trending score', async () => {
    const hashtag = new Hashtag({
      name: 'travel',
      totalUsage: 9,
      recentUsage: {
        lastHour: 2,
        last24Hours: 6,
        last7Days: 14,
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      peakUsage: {
        count: 4,
        date: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
    const originalSave = hashtag.save;

    hashtag.save = async function () {
      return this;
    };

    const result = await hashtag.incrementUsage();
    assert.equal(result, hashtag);
    assert.equal(hashtag.totalUsage, 10);
    assert.equal(hashtag.recentUsage.lastHour, 3);
    assert.equal(hashtag.recentUsage.last24Hours, 7);
    assert.equal(hashtag.recentUsage.last7Days, 15);
    assert.equal(hashtag.peakUsage.count, 7);
    assert.ok(hashtag.trendingScore > 0);
    assert.ok(hashtag.velocity >= 0);

    hashtag.save = originalSave;
  });

  it('hashtag statics should support trending, featured, search, creation, bulk increments, and resets', async () => {
    const findQueries = [];
    let bulkWriteArgs = null;
    let updateManyArgs = null;
    let createdDoc = null;

    Hashtag.find = query => {
      findQueries.push(query);
      return {
        sort() {
          return this;
        },
        limit() {
          return this;
        },
        select() {
          return this;
        },
        lean: async () => {
          if (query.name?.$regex) {
            return [{ _id: 'prefix-1', name: 'travel' }];
          }

          if (query.$text) {
            return [{ _id: 'text-1', name: 'foodtravel' }];
          }

          return [{ name: 'featured-or-trending' }];
        },
      };
    };
    Hashtag.findOne = async query =>
      query.name === 'travel'
        ? { _id: 'existing-hashtag', name: 'travel' }
        : null;
    Hashtag.create = async payload => {
      createdDoc = { _id: 'new-hashtag', ...payload };
      return createdDoc;
    };
    Hashtag.bulkWrite = async ops => {
      bulkWriteArgs = ops;
      return { acknowledged: true };
    };
    Hashtag.updateMany = async (...args) => {
      updateManyArgs = args;
      return { acknowledged: true };
    };

    assert.deepEqual(
      await Hashtag.getTrending({ limit: 5, category: 'travel', excludeBanned: true }),
      [{ name: 'featured-or-trending' }]
    );
    assert.deepEqual(await Hashtag.getFeatured(3), [{ name: 'featured-or-trending' }]);
    assert.deepEqual(await Hashtag.searchHashtags('travel', 1), [
      { _id: 'prefix-1', name: 'travel' },
    ]);
    assert.deepEqual(await Hashtag.searchHashtags('travel', 3), [
      { _id: 'prefix-1', name: 'travel' },
      { _id: 'text-1', name: 'foodtravel' },
    ]);
    assert.deepEqual(await Hashtag.findOrCreate('travel'), {
      _id: 'existing-hashtag',
      name: 'travel',
    });
    assert.deepEqual(await Hashtag.findOrCreate('newtag'), {
      _id: 'new-hashtag',
      name: 'newtag',
      firstUsedAt: createdDoc.firstUsedAt,
    });

    await Hashtag.incrementMany([' Travel ', 'Food']);
    assert.equal(bulkWriteArgs.length, 2);
    assert.equal(bulkWriteArgs[0].updateOne.filter.name, 'travel');
    assert.equal(bulkWriteArgs[1].updateOne.filter.name, 'food');

    assert.equal(await Hashtag.resetRecentCounts('invalid'), undefined);
    await Hashtag.resetRecentCounts('daily');
    assert.deepEqual(updateManyArgs[1], { $set: { 'recentUsage.last24Hours': 0 } });
    assert.equal(findQueries[0].isBanned, false);
    assert.equal(findQueries[0].category, 'travel');
  });
});
