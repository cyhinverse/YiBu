import { Schema, Types, model } from "mongoose";

const NotificationSchema = new Schema({
  recipient: { type: Types.ObjectId, ref: "User", required: true },
  sender: { type: Types.ObjectId, ref: "User", required: false },
  type: { type: String, enum: ["like", "comment", "follow"], required: true },
  post: { type: Types.ObjectId, ref: "Post", required: false },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Notification = model("Notification", NotificationSchema);
