import mongoose from "mongoose";

const SystemLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    details: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    level: {
      type: String,
      enum: ["info", "warning", "error", "critical"],
      default: "info",
      index: true,
    },
    module: {
      type: String,
      enum: ["auth", "user", "post", "comment", "admin", "system"],
      default: "system",
      index: true,
    },
    metadata: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

// Thêm index cho truy vấn nhanh
SystemLogSchema.index({ createdAt: -1 });
SystemLogSchema.index({ action: 1, level: 1 });

const SystemLog = mongoose.model("SystemLog", SystemLogSchema);

export default SystemLog;
