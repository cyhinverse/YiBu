import mongoose from "mongoose";

const systemSettingSchema = new mongoose.Schema(
  {
    general: {
      siteName: { type: String, default: "YiBu Social" },
      siteDescription: { type: String, default: "Nền tảng mạng xã hội kết nối mọi người" },
      siteUrl: { type: String, default: "https://yibu.social" },
      contactEmail: { type: String, default: "admin@yibu.social" },
      supportEmail: { type: String, default: "support@yibu.social" },
    },
    features: {
      allowRegistration: { type: Boolean, default: true },
      emailVerification: { type: Boolean, default: true },
      twoFactorAuth: { type: Boolean, default: false },
      publicProfiles: { type: Boolean, default: true },
      allowComments: { type: Boolean, default: true },
      allowSharing: { type: Boolean, default: true },
    },
    content: {
      maxPostLength: { type: Number, default: 5000 },
      maxImageSize: { type: Number, default: 10 }, // MB
      maxVideoSize: { type: Number, default: 100 }, // MB
      allowedImageTypes: { type: String, default: "jpg, png, gif, webp" },
      allowedVideoTypes: { type: String, default: "mp4, mov, avi" },
      autoModeration: { type: Boolean, default: true },
    },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      digestFrequency: {
        type: String,
        enum: ["realtime", "daily", "weekly", "never"],
        default: "daily",
      },
    },
    security: {
      sessionTimeout: { type: Number, default: 30 }, // Minutes
      maxLoginAttempts: { type: Number, default: 5 },
      passwordMinLength: { type: Number, default: 8 },
      requireSpecialChar: { type: Boolean, default: true },
      requireNumber: { type: Boolean, default: true },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const SystemSetting = mongoose.model("SystemSetting", systemSettingSchema);
export default SystemSetting;
