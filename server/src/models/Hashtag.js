import { Schema, model } from "mongoose";

/**
 * Hashtag Model - Optimized for Trending & Discovery
 *
 * Key Changes:
 * 1. REMOVED posts array (unbounded growth problem)
 * 2. Added time-based usage tracking for trending
 * 3. Added category for hashtag classification
 * 4. Proper indexes for trending queries
 */
const HashtagSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Total usage count (all time)
    totalUsage: {
      type: Number,
      default: 0,
      index: true,
    },

    // Recent usage for trending calculation
    recentUsage: {
      // Usage in last 1 hour
      lastHour: { type: Number, default: 0 },
      // Usage in last 24 hours
      last24Hours: { type: Number, default: 0 },
      // Usage in last 7 days
      last7Days: { type: Number, default: 0 },
      // Last updated timestamp
      updatedAt: { type: Date, default: Date.now },
    },

    // Trending score (calculated periodically)
    trendingScore: {
      type: Number,
      default: 0,
      index: true,
    },

    // Velocity (rate of usage change)
    velocity: {
      type: Number,
      default: 0,
    },

    // Category for hashtag organization
    category: {
      type: String,
      enum: [
        "general",
        "entertainment",
        "sports",
        "news",
        "technology",
        "lifestyle",
        "food",
        "travel",
        "fashion",
        "art",
        "music",
        "gaming",
        "education",
        "business",
        "health",
        "other",
      ],
      default: "general",
    },

    // Is this hashtag banned/restricted?
    isBanned: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Is this a featured/promoted hashtag?
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // First used timestamp
    firstUsedAt: {
      type: Date,
      default: Date.now,
    },

    // Peak usage (for historical reference)
    peakUsage: {
      count: { type: Number, default: 0 },
      date: { type: Date },
    },
  },
  {
    collection: "Hashtags",
    timestamps: true,
  }
);

// ============ INDEXES ============
// Trending queries
HashtagSchema.index({ trendingScore: -1 });
HashtagSchema.index({ "recentUsage.last24Hours": -1 });
HashtagSchema.index({ velocity: -1 });

// Category-based queries
HashtagSchema.index({ category: 1, trendingScore: -1 });
HashtagSchema.index({ category: 1, totalUsage: -1 });

// Featured hashtags
HashtagSchema.index({ isFeatured: 1, trendingScore: -1 });

// Search
HashtagSchema.index({ name: "text" });

// ============ METHODS ============
HashtagSchema.methods.incrementUsage = async function () {
  this.totalUsage += 1;
  this.recentUsage.lastHour += 1;
  this.recentUsage.last24Hours += 1;
  this.recentUsage.last7Days += 1;
  this.recentUsage.updatedAt = new Date();

  // Update peak if current is higher
  if (this.recentUsage.last24Hours > (this.peakUsage?.count || 0)) {
    this.peakUsage = {
      count: this.recentUsage.last24Hours,
      date: new Date(),
    };
  }

  this.calculateTrendingScore();
  return this.save();
};

HashtagSchema.methods.calculateTrendingScore = function () {
  // Weighted score based on recency
  // Recent activity is worth more
  const hourWeight = 10;
  const dayWeight = 3;
  const weekWeight = 1;

  const weightedUsage =
    this.recentUsage.lastHour * hourWeight +
    this.recentUsage.last24Hours * dayWeight +
    this.recentUsage.last7Days * weekWeight;

  // Calculate velocity (change rate)
  const avgDaily = this.recentUsage.last7Days / 7;
  this.velocity =
    avgDaily > 0 ? (this.recentUsage.last24Hours - avgDaily) / avgDaily : 0;

  // Boost for positive velocity (growing hashtags)
  const velocityBoost = this.velocity > 0 ? 1 + Math.min(this.velocity, 2) : 1;

  this.trendingScore = Math.round(weightedUsage * velocityBoost);
  return this.trendingScore;
};

// ============ STATICS ============
HashtagSchema.statics.getTrending = async function (options = {}) {
  const { limit = 20, category = null, excludeBanned = true } = options;

  const query = {};

  if (excludeBanned) {
    query.isBanned = false;
  }

  if (category) {
    query.category = category;
  }

  return this.find(query)
    .sort({ trendingScore: -1 })
    .limit(limit)
    .select("name totalUsage trendingScore category recentUsage.last24Hours")
    .lean();
};

HashtagSchema.statics.getFeatured = async function (limit = 10) {
  return this.find({ isFeatured: true, isBanned: false })
    .sort({ trendingScore: -1 })
    .limit(limit)
    .select("name totalUsage trendingScore category")
    .lean();
};

HashtagSchema.statics.searchHashtags = async function (query, limit = 10) {
  // First try prefix match (faster)
  const prefixResults = await this.find({
    name: { $regex: `^${query.toLowerCase()}`, $options: "i" },
    isBanned: false,
  })
    .sort({ totalUsage: -1 })
    .limit(limit)
    .select("name totalUsage trendingScore")
    .lean();

  if (prefixResults.length >= limit) {
    return prefixResults;
  }

  // Fall back to text search for remaining slots
  const textResults = await this.find({
    $text: { $search: query },
    isBanned: false,
    _id: { $nin: prefixResults.map((r) => r._id) },
  })
    .sort({ score: { $meta: "textScore" }, totalUsage: -1 })
    .limit(limit - prefixResults.length)
    .select("name totalUsage trendingScore")
    .lean();

  return [...prefixResults, ...textResults];
};

HashtagSchema.statics.findOrCreate = async function (name) {
  const normalizedName = name.toLowerCase().trim();

  let hashtag = await this.findOne({ name: normalizedName });

  if (!hashtag) {
    hashtag = await this.create({
      name: normalizedName,
      firstUsedAt: new Date(),
    });
  }

  return hashtag;
};

// Batch increment for multiple hashtags
HashtagSchema.statics.incrementMany = async function (hashtagNames) {
  const normalizedNames = hashtagNames.map((n) => n.toLowerCase().trim());

  // Upsert all hashtags
  const bulkOps = normalizedNames.map((name) => ({
    updateOne: {
      filter: { name },
      update: {
        $inc: {
          totalUsage: 1,
          "recentUsage.lastHour": 1,
          "recentUsage.last24Hours": 1,
          "recentUsage.last7Days": 1,
        },
        $set: { "recentUsage.updatedAt": new Date() },
        $setOnInsert: {
          name,
          firstUsedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));

  return this.bulkWrite(bulkOps);
};

// Reset hourly/daily/weekly counts (run via cron job)
HashtagSchema.statics.resetRecentCounts = async function (period) {
  const field = {
    hourly: "recentUsage.lastHour",
    daily: "recentUsage.last24Hours",
    weekly: "recentUsage.last7Days",
  }[period];

  if (!field) return;

  await this.updateMany({}, { $set: { [field]: 0 } });
};

const Hashtag = model("Hashtag", HashtagSchema);
export default Hashtag;
