import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, default: "" },
    
    // Embedded Profile Data
    profile: {
      avatar: {
        type: String,
        default:
          "https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1",
      },
      bio: { type: String, default: "" },
      birthday: { type: Date, default: null },
      gender: {
        type: String,
        enum: ["male", "female", "other"],
        default: "other",
      },
      website: { type: String, default: "" },
      interests: { type: String, default: "" },
    },
    
    // Embedded Settings Data
    settings: {
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
          blockList: [{ type: Schema.Types.ObjectId, ref: "User" }],
        },
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

    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    verified: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    
    // Moderation (Ban & Flag Status)
    moderation: {
      isBanned: { type: Boolean, default: false },
      banReason: { type: String, default: "" },
      banExpiration: { type: Date, default: null },
      isFlagged: { type: Boolean, default: false },
      flagReason: { type: String, default: "" },
      flaggedAt: { type: Date, default: null },
      flaggedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
      
      // Temporary Ban Info
      tempUnbanReason: { type: String, default: "" },
      tempUnbanExpiration: { type: Date, default: null },
      tempUnbanBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
      previousBanState: {
        isBanned: { type: Boolean, default: false },
        banReason: { type: String, default: "" },
        banExpiration: { type: Date, default: null },
      },
      banHistory: [
        {
          action: { type: String, enum: ["ban", "unban", "extend", "tempUnban"] },
          reason: { type: String },
          duration: { type: Number }, // in days
          performedBy: { type: Schema.Types.ObjectId, ref: "User" },
          performedAt: { type: Date, default: Date.now },
        },
      ],
    },
    
    lastActivity: { type: Date, default: Date.now },
    loginAttempts: { type: Number, default: 0 },
  },
  {
    collection: "Users",
    timestamps: true,
  }
);

export const User = model("User", UserSchema);
export default User;
