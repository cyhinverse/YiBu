import { Schema, Types, model } from "mongoose";

const NotificationSchema = new Schema(
  {
    recipient: { type: Types.ObjectId, ref: "User", required: true },
    sender: { type: Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["like", "comment", "follow", "save", "mention"],
      required: true,
    },
    content: { type: String, required: true },
    post: { type: Types.ObjectId, ref: "Post", required: false },
    comment: { type: Types.ObjectId, ref: "Comment", required: false },
    isRead: { type: Boolean, default: false },
  },
  {
    collection: "Notifications",
    timestamps: true,
  }
);

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = model("Notification", NotificationSchema);
export default Notification;
