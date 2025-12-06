import { Schema, Types, model } from "mongoose";

const MessageSchema = new Schema(
  {
    sender: { type: Types.ObjectId, ref: "User", required: true },
    receiver: { type: Types.ObjectId, ref: "User", required: true },
    content: { type: String },
    // Keeping media as standard structure, or flexible. 
    // Assuming simple string URL or Object for now based on service usage (service handles explicit logic)
    media: { type: Schema.Types.Mixed, default: null }, 
    isRead: { type: Boolean, default: false },
  },
  {
    collection: "Messages",
    timestamps: true,
  }
);

const Message = model("Message", MessageSchema);
export default Message;
