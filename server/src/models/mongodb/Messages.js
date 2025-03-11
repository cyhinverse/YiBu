import { Schema, Types, model } from "mongoose";

const MessageSchema = new Schema({
  sender: { type: Types.ObjectId, ref: "User", required: true },
  receiver: { type: Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: false },
  media: { type: String, required: false },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Message = model("Message", MessageSchema);
