import { Schema, model, Types } from "mongoose";

const UserSettingsSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Notification Settings
    notifications: {
      pushNotifications: {
        enabled: { type: Boolean, default: true },
        likes: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        follows: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
      },
      emailNotifications: {
        enabled: { type: Boolean, default: true },
        accountUpdates: { type: Boolean, default: true },
        newFeatures: { type: Boolean, default: true },
        marketingEmails: { type: Boolean, default: false },
      },
      activityNotifications: {
        friendActivity: { type: Boolean, default: true },
        groupActivity: { type: Boolean, default: true },
        eventActivity: { type: Boolean, default: true },
      },
    },
    // Privacy Settings
    privacy: {
      profileVisibility: {
        type: String,
        enum: ["public", "friends", "private"],
        default: "public",
      },
      postVisibility: {
        type: String,
        enum: ["public", "friends", "private"],
        default: "public",
      },
      messagePermission: {
        type: String,
        enum: ["everyone", "friends", "none"],
        default: "everyone",
      },
      searchVisibility: { type: Boolean, default: true },
      activityStatus: { type: Boolean, default: true },
      blockList: [{ type: Types.ObjectId, ref: "User" }],
    },
    // Security Settings
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      loginAlerts: { type: Boolean, default: true },
      trustedDevices: [
        {
          deviceId: { type: String },
          deviceName: { type: String },
          lastUsed: { type: Date },
        },
      ],
      securityQuestions: [
        {
          question: { type: String },
          answer: { type: String },
        },
      ],
    },
    // Content Settings
    content: {
      language: { type: String, default: "vi" },
      contentVisibility: {
        type: String,
        enum: ["all", "moderate", "strict"],
        default: "moderate",
      },
      autoplayEnabled: { type: Boolean, default: true },
      contentFilters: {
        adult: { type: Boolean, default: true },
        violence: { type: Boolean, default: true },
        hate: { type: Boolean, default: true },
      },
    },
    // Theme Settings
    theme: {
      appearance: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      primaryColor: { type: String, default: "#4f46e5" },
      fontSize: {
        type: String,
        enum: ["small", "medium", "large"],
        default: "medium",
      },
    },
  },
  {
    timestamps: true,
    collection: "UserSettings",
  }
);

export default model("UserSettings", UserSettingsSchema);
