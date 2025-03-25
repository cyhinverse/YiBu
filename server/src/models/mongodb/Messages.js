import { Schema, Types, model } from "mongoose";

const MessageSchema = new Schema(
  {
    sender: { type: Types.ObjectId, ref: "User", required: true },
    receiver: { type: Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: false },
    media: { type: String, required: false, default: null },
    isRead: { type: Boolean, default: false },
  },
  {
    collection: "Messages",
    timestamps: true,
  }
);

export const Message = model("Message", MessageSchema);
export default Message;
