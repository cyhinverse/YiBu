import { Schema, model, Types } from "mongoose";

const UserSettingsSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Notification Preferences
    notifications: {
      push: {
        enabled: { type: Boolean, default: true },
        likes: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        follows: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
      },
      email: {
        enabled: { type: Boolean, default: true },
        accountUpdates: { type: Boolean, default: true },
        newFeatures: { type: Boolean, default: false },
        marketing: { type: Boolean, default: false },
        digest: {
          type: String,
          enum: ["none", "daily", "weekly"],
          default: "weekly",
        },
      },
    },

    // Privacy Settings
    privacy: {
      postVisibility: {
        type: String,
        enum: ["public", "followers", "private"],
        default: "public",
      },
      searchable: { type: Boolean, default: true },
      showOnlineStatus: { type: Boolean, default: true },
      allowTagging: { type: Boolean, default: true },
    },

    // Security
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      twoFactorSecret: { type: String, select: false },
      twoFactorBackupCodes: [{ type: String, select: false }],
      loginAlerts: { type: Boolean, default: true },
      trustedDevices: [
        {
          deviceId: { type: String },
          deviceName: { type: String },
          browser: { type: String },
          os: { type: String },
          lastUsed: { type: Date },
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },

    // Content Preferences (for recommendation)
    content: {
      language: { type: String, default: "vi" },
      contentFilter: {
        type: String,
        enum: ["all", "moderate", "strict"],
        default: "moderate",
      },
      autoplayVideos: { type: Boolean, default: true },
      showSensitiveContent: { type: Boolean, default: false },
    },

    // UI Preferences
    appearance: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      fontSize: {
        type: String,
        enum: ["small", "medium", "large"],
        default: "medium",
      },
      compactMode: { type: Boolean, default: false },
    },

    // Blocked Users (separate for scalability, but keep recent ones here)
    blockedUsers: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],

    // Muted Users (hide their content but don't block)
    mutedUsers: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    collection: "UserSettings",
    timestamps: true,
  }
);

// ============ INDEXES ============
// UserSettingsSchema.index({ user: 1 }, { unique: true }); // Removed: duplicate with schema 'unique: true'
UserSettingsSchema.index({ blockedUsers: 1 });
UserSettingsSchema.index({ mutedUsers: 1 });

// ============ STATICS ============
UserSettingsSchema.statics.getOrCreate = async function (userId) {
  let settings = await this.findOne({ user: userId });

  if (!settings) {
    settings = await this.create({ user: userId });
  }

  return settings;
};

UserSettingsSchema.statics.isBlocked = async function (userId, targetUserId) {
  const settings = await this.findOne({
    user: userId,
    blockedUsers: targetUserId,
  }).lean();

  return !!settings;
};

UserSettingsSchema.statics.isMuted = async function (userId, targetUserId) {
  const settings = await this.findOne({
    user: userId,
    mutedUsers: targetUserId,
  }).lean();

  return !!settings;
};

const UserSettings = model("UserSettings", UserSettingsSchema);
export default UserSettings;
