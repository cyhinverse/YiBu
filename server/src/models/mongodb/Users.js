import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, default: "" },
    avatar: {
      type: String,
      default:
        "https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1",
    },
    profile: { type: Schema.Types.ObjectId, ref: "Profile" },
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    verified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: "",
    },
    banExpiration: {
      type: Date,
      default: null,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: "",
    },
    flaggedAt: {
      type: Date,
      default: null,
    },
    flaggedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    tempUnbanReason: {
      type: String,
      default: "",
    },
    tempUnbanExpiration: {
      type: Date,
      default: null,
    },
    tempUnbanBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
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
  {
    collection: "Users",
    timestamps: true,
  }
);

export const User = model("User", UserSchema);
export default User;
