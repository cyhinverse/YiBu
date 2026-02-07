import mongoose from 'mongoose';

import config from '../src/configs/config.js';
import ConnectToMongodb from '../src/database/connect.mongodb.js';

import Post from '../src/models/Post.js';
import Hashtag from '../src/models/Hashtag.js';

const args = new Set(process.argv.slice(2));
const getArgValue = (name, fallback = null) => {
  const prefix = `--${name}=`;
  for (const a of process.argv.slice(2)) {
    if (a.startsWith(prefix)) return a.slice(prefix.length);
  }
  return fallback;
};

const prune = args.has('--prune');
const uri = getArgValue('uri', null) || config.mongodb.uri;

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const computeTrending = (lastHour, last24Hours, last7Days) => {
  const hourWeight = 10;
  const dayWeight = 3;
  const weekWeight = 1;

  const weightedUsage =
    lastHour * hourWeight + last24Hours * dayWeight + last7Days * weekWeight;

  const avgDaily = last7Days / 7;
  const velocity =
    avgDaily > 0 ? (last24Hours - avgDaily) / avgDaily : 0;

  const velocityBoost =
    velocity > 0 ? 1 + Math.min(velocity, 2) : 1;

  return {
    trendingScore: Math.round(weightedUsage * velocityBoost),
    velocity,
  };
};

async function main() {
  if (!uri) {
    // eslint-disable-next-line no-console
    console.error('Missing MongoDB URI. Set MONGO_URI/MONGODB_URI or pass --uri=...');
    process.exit(1);
  }

  await ConnectToMongodb(uri);

  try {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const normalizeTagExpr = {
      $let: {
        vars: { h: '$hashtags' },
        in: {
          $toLower: {
            $trim: {
              input: {
                $cond: [
                  { $eq: [{ $type: '$$h' }, 'string'] },
                  '$$h',
                  {
                    $cond: [
                      {
                        $and: [
                          { $eq: [{ $type: '$$h' }, 'object'] },
                          { $ne: ['$$h.tag', null] },
                        ],
                      },
                      '$$h.tag',
                      {
                        $cond: [
                          {
                            $and: [
                              { $eq: [{ $type: '$$h' }, 'object'] },
                              { $ne: ['$$h.name', null] },
                            ],
                          },
                          '$$h.name',
                          '',
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    };

    // Tags that exist in any non-deleted post (regardless of visibility).
    // Used for pruning only (delete hashtags with no posts at all).
    const allTagRows = await Post.aggregate([
      {
        $match: {
          isDeleted: false,
          hashtags: { $exists: true, $ne: [] },
        },
      },
      { $unwind: '$hashtags' },
      { $project: { tag: normalizeTagExpr } },
      { $match: { tag: { $ne: '' } } },
      { $group: { _id: '$tag' } },
    ]);
    const allNames = allTagRows.map(r => r._id);

    // Normalize hashtags:
    // - current schema: string[]
    // - legacy data: [{ tag, hashtagId }] or similar objects
    const rows = await Post.aggregate([
      {
        $match: {
          isDeleted: false,
          visibility: 'public',
          'moderation.status': 'approved',
          hashtags: { $exists: true, $ne: [] },
        },
      },
      { $unwind: '$hashtags' },
      {
        $project: {
          createdAt: 1,
          tag: normalizeTagExpr,
        },
      },
      { $match: { tag: { $ne: '' } } },
      {
        $group: {
          _id: '$tag',
          totalUsage: { $sum: 1 },
          lastHour: {
            $sum: { $cond: [{ $gte: ['$createdAt', hourAgo] }, 1, 0] },
          },
          last24Hours: {
            $sum: { $cond: [{ $gte: ['$createdAt', dayAgo] }, 1, 0] },
          },
          last7Days: {
            $sum: { $cond: [{ $gte: ['$createdAt', weekAgo] }, 1, 0] },
          },
          firstUsedAt: { $min: '$createdAt' },
          lastUsedAt: { $max: '$createdAt' },
        },
      },
      { $sort: { totalUsage: -1 } },
    ]);

    const names = rows.map(r => r._id);

    if (prune) {
      // Keep featured/banned tags even if they have no posts.
      await Hashtag.deleteMany({
        name: { $nin: allNames },
        isFeatured: { $ne: true },
        isBanned: { $ne: true },
      });
    }

    if (rows.length === 0) {
      // eslint-disable-next-line no-console
      console.log('No hashtags found in Posts matching criteria.');
      return;
    }

    const ops = rows.map(r => {
      const totalUsage = clamp(r.totalUsage || 0, 0, Number.MAX_SAFE_INTEGER);
      const lastHour = clamp(r.lastHour || 0, 0, Number.MAX_SAFE_INTEGER);
      const last24Hours = clamp(r.last24Hours || 0, 0, Number.MAX_SAFE_INTEGER);
      const last7Days = clamp(r.last7Days || 0, 0, Number.MAX_SAFE_INTEGER);

      const { trendingScore, velocity } = computeTrending(
        lastHour,
        last24Hours,
        last7Days
      );

      return {
        updateOne: {
          filter: { name: r._id },
          update: {
            $setOnInsert: {
              name: r._id,
              firstUsedAt: r.firstUsedAt || now,
            },
            $set: {
              totalUsage,
              recentUsage: {
                lastHour,
                last24Hours,
                last7Days,
                updatedAt: now,
              },
              trendingScore,
              velocity,
              // Best-effort: keep peak aligned with current 24h usage.
              peakUsage: { count: last24Hours, date: now },
            },
          },
          upsert: true,
        },
      };
    });

    const res = await Hashtag.bulkWrite(ops, { ordered: false });

    // eslint-disable-next-line no-console
    console.log(
      `Hashtag sync complete: upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount} pruned=${prune ? 'yes' : 'no'}`
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('Hashtag sync failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
