import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';

import config from '../src/configs/config.js';
import ConnectToMongodb from '../src/database/connect.mongodb.js';

import User from '../src/models/User.js';
import UserSettings from '../src/models/UserSettings.js';
import Post from '../src/models/Post.js';
import Comment from '../src/models/Comment.js';
import Like from '../src/models/Like.js';
import SavePost from '../src/models/SavePost.js';
import Follow from '../src/models/Follow.js';
import Hashtag from '../src/models/Hashtag.js';
import UserInteraction from '../src/models/UserInteraction.js';
import RefreshToken from '../src/models/RefreshToken.js';

import { hashPassword } from '../src/utils/HashPassword.js';

const args = new Set(process.argv.slice(2));
const getArgValue = (name, fallback = null) => {
  const prefix = `--${name}=`;
  for (const a of process.argv.slice(2)) {
    if (a.startsWith(prefix)) return a.slice(prefix.length);
  }
  return fallback;
};

const drop = args.has('--drop');
const usersCount = Number.parseInt(getArgValue('users', '12'), 10);
const postsPerUser = Number.parseInt(getArgValue('postsPerUser', '3'), 10);
const commentsPerPost = Number.parseInt(getArgValue('commentsPerPost', '4'), 10);
const repliesPerCommentMax = Number.parseInt(
  getArgValue('repliesPerCommentMax', '2'),
  10
);
const likesPerPost = Number.parseInt(getArgValue('likesPerPost', '8'), 10);
const savesPerPost = Number.parseInt(getArgValue('savesPerPost', '3'), 10);
const followsPerUser = Number.parseInt(getArgValue('followsPerUser', '5'), 10);
const seedValue = Number.parseInt(
  getArgValue('seed', String(Date.now() % 2147483647)),
  10
);

faker.seed(Number.isFinite(seedValue) ? seedValue : 12345);

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const sampleUnique = (arr, count, excludeSet = new Set()) => {
  const pool = arr.filter(x => !excludeSet.has(String(x)));
  const k = clamp(count, 0, pool.length);
  return faker.helpers.arrayElements(pool, k);
};

const TAG_POOL = [
  'yibu',
  'vietnam',
  'saigon',
  'hanoi',
  'food',
  'travel',
  'music',
  'art',
  'fitness',
  'coding',
  'javascript',
  'react',
  'nodejs',
  'mongodb',
  'photography',
  'coffee',
  'movie',
  'pets',
  'gaming',
  'life',
  'study',
  'business',
  'news',
  'tech',
  'fashion',
];

const buildCaption = (tags) => {
  const base = faker.lorem.sentences(faker.number.int({ min: 1, max: 3 }));
  if (!tags || tags.length === 0) return base;
  const hashtagText = tags.map(t => `#${t}`).join(' ');
  return `${base}\n\n${hashtagText}`;
};

const randomMedia = () => {
  const seed = faker.string.alphanumeric(12).toLowerCase();
  return {
    url: `https://picsum.photos/seed/${seed}/1080/1080`,
    type: 'image',
    width: 1080,
    height: 1080,
  };
};

async function clearCollections() {
  await Promise.all([
    User.deleteMany({}),
    UserSettings.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Like.deleteMany({}),
    SavePost.deleteMany({}),
    Follow.deleteMany({}),
    Hashtag.deleteMany({}),
    UserInteraction.deleteMany({}),
    RefreshToken.deleteMany({}),
  ]);
}

async function recalcPostScores(postIds) {
  const posts = await Post.find({ _id: { $in: postIds } });
  const ops = posts.map(p => {
    p.calculateQualityScore();
    p.calculateEngagementScore();
    p.calculateTrendingScore();
    return {
      updateOne: {
        filter: { _id: p._id },
        update: {
          $set: {
            qualityScore: p.qualityScore,
            engagementScore: p.engagementScore,
            trendingScore: p.trendingScore,
            lastEngagedAt: new Date(),
          },
        },
      },
    };
  });
  if (ops.length > 0) await Post.bulkWrite(ops);
}

async function recalcHashtagScores(tagNames) {
  const hashtags = await Hashtag.find({ name: { $in: tagNames } });
  const ops = hashtags.map(h => {
    h.calculateTrendingScore();
    return {
      updateOne: {
        filter: { _id: h._id },
        update: {
          $set: {
            trendingScore: h.trendingScore,
            velocity: h.velocity,
          },
        },
      },
    };
  });
  if (ops.length > 0) await Hashtag.bulkWrite(ops);
}

async function main() {
  const uri = getArgValue('uri', null) || config.mongodb.uri;
  if (!uri) {
    // eslint-disable-next-line no-console
    console.error('Missing MongoDB URI. Set MONGO_URI/MONGODB_URI or pass --uri=...');
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(
    `Seed config: users=${usersCount} postsPerUser=${postsPerUser} commentsPerPost=${commentsPerPost} likesPerPost=${likesPerPost} savesPerPost=${savesPerPost} followsPerUser=${followsPerUser} seed=${seedValue} drop=${drop}`
  );

  await ConnectToMongodb(uri);

  try {
    if (drop) {
      // eslint-disable-next-line no-console
      console.log('Clearing collections...');
      await clearCollections();
    }

    const suffix = faker.string.alphanumeric(6).toLowerCase();
    const defaultPassword = 'Password123!';
    const passwordHash = await hashPassword(defaultPassword);
    if (!passwordHash) throw new Error('hashPassword returned empty result');

    // Create users (1 admin + N normal users)
    const users = [];
    const admin = await User.create({
      username: `admin_${suffix}`,
      email: `admin_${suffix}@yibu.local`,
      password: passwordHash,
      name: 'Admin',
      verified: true,
      isAdmin: true,
      interests: faker.helpers.arrayElements(TAG_POOL, 5),
      location: faker.location.city(),
      lastActiveAt: new Date(),
    });
    users.push(admin);

    for (let i = 0; i < usersCount; i += 1) {
      const unameBase = faker.internet.username().replace(/[^a-zA-Z0-9_]/g, '');
      const username = `${unameBase}_${suffix}_${i}`.toLowerCase();
      const email = `${username}@example.com`;
      const u = await User.create({
        username,
        email,
        password: passwordHash,
        name: faker.person.fullName(),
        avatar: faker.image.avatar(),
        bio: faker.lorem.sentence(),
        gender: faker.helpers.arrayElement(['male', 'female', 'other']),
        interests: faker.helpers.arrayElements(TAG_POOL, faker.number.int({ min: 2, max: 6 })),
        location: faker.location.city(),
        verified: faker.number.int({ min: 1, max: 10 }) <= 2,
        lastActiveAt: faker.date.recent({ days: 5 }),
      });
      users.push(u);
    }

    await Promise.all(users.map(u => UserSettings.getOrCreate(u._id)));

    // Create follows
    // Keep it small and deterministic-ish; Follow.follow updates counters + interaction logs.
    for (const u of users) {
      const others = users.filter(x => x._id.toString() !== u._id.toString());
      const targets = sampleUnique(others, followsPerUser, new Set());
      for (const t of targets) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await Follow.follow(u._id, t._id);
        } catch {
          // ignore duplicates
        }
      }
    }

    // Create posts
    const postIds = [];
    const usedTags = new Set();

    for (const u of users) {
      for (let i = 0; i < postsPerUser; i += 1) {
        const tags = faker.helpers.arrayElements(
          TAG_POOL,
          faker.number.int({ min: 0, max: 4 })
        );
        tags.forEach(t => usedTags.add(t));

        const createdAt = faker.date.recent({ days: 14 });
        // eslint-disable-next-line no-await-in-loop
        const post = await Post.create({
          user: u._id,
          caption: buildCaption(tags),
          media: [randomMedia()],
          visibility: 'public',
          createdAt,
          updatedAt: createdAt,
          lastEngagedAt: createdAt,
        });
        postIds.push(post._id);

        if (tags.length > 0) {
          // eslint-disable-next-line no-await-in-loop
          await Hashtag.incrementMany(tags);
        }
      }
    }

    // Sync postsCount quickly (denormalized field)
    const postCounts = await Post.aggregate([
      { $match: { _id: { $in: postIds } } },
      { $group: { _id: '$user', c: { $sum: 1 } } },
    ]);
    if (postCounts.length > 0) {
      await User.bulkWrite(
        postCounts.map(r => ({
          updateOne: {
            filter: { _id: r._id },
            update: { $set: { postsCount: r.c } },
          },
        }))
      );
    }

    // Create comments + replies (Comment hooks will maintain Post.commentsCount)
    const posts = await Post.find({ _id: { $in: postIds } }).select('_id user createdAt');
    const allUsers = users.map(u => u._id);
    for (const p of posts) {
      const baseTime = p.createdAt || new Date();
      for (let i = 0; i < commentsPerPost; i += 1) {
        const commenter = faker.helpers.arrayElement(allUsers);
        // eslint-disable-next-line no-await-in-loop
        const c = await Comment.create({
          user: commenter,
          post: p._id,
          content: faker.lorem.sentences(faker.number.int({ min: 1, max: 2 })),
          createdAt: faker.date.between({ from: baseTime, to: new Date() }),
        });

        const repliesCount = faker.number.int({ min: 0, max: repliesPerCommentMax });
        for (let r = 0; r < repliesCount; r += 1) {
          const replier = faker.helpers.arrayElement(allUsers);
          // eslint-disable-next-line no-await-in-loop
          await Comment.create({
            user: replier,
            post: p._id,
            parentComment: c._id,
            content: faker.lorem.sentence(),
            createdAt: faker.date.between({ from: c.createdAt, to: new Date() }),
          });
        }
      }
    }

    // Likes + saves
    for (const p of posts) {
      const likeUsers = faker.helpers.arrayElements(
        allUsers,
        clamp(likesPerPost, 0, allUsers.length)
      );
      for (const uid of likeUsers) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await Like.likePost(uid, p._id);
        } catch {
          // ignore duplicates
        }
      }

      const saveUsers = faker.helpers.arrayElements(
        allUsers,
        clamp(savesPerPost, 0, allUsers.length)
      );
      for (const uid of saveUsers) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await SavePost.savePost(uid, p._id, 'default');
        } catch {
          // ignore duplicates
        }
      }
    }

    await recalcPostScores(postIds);
    await recalcHashtagScores([...usedTags]);

    // Update user metrics (engagementRate/activityScore, etc.)
    for (const u of users) {
      // eslint-disable-next-line no-await-in-loop
      const doc = await User.findById(u._id).select('+loginAttempts');
      if (doc?.updateEngagementMetrics) {
        // eslint-disable-next-line no-await-in-loop
        await doc.updateEngagementMetrics();
      }
    }

    const counts = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments(),
      Like.countDocuments(),
      SavePost.countDocuments(),
      Follow.countDocuments(),
      Hashtag.countDocuments(),
    ]);

    // eslint-disable-next-line no-console
    console.log('\nSeed complete.');
    // eslint-disable-next-line no-console
    console.log(
      `Counts: Users=${counts[0]} Posts=${counts[1]} Comments=${counts[2]} Likes=${counts[3]} Saves=${counts[4]} Follows=${counts[5]} Hashtags=${counts[6]}`
    );
    // eslint-disable-next-line no-console
    console.log('\nLogin credentials (all seeded users share the same password):');
    // eslint-disable-next-line no-console
    console.log(`Password: ${defaultPassword}`);
    // eslint-disable-next-line no-console
    console.log(`Admin email: ${admin.email}`);
    // eslint-disable-next-line no-console
    console.log(`Admin username: ${admin.username}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
