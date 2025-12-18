import { Schema, Types, model } from "mongoose";

const ConversationSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    members: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    admin: {
      type: Types.ObjectId,
      ref: "User",
    },
    lastMessage: {
      type: Types.ObjectId,
      ref: "Message",
    },
    // For direct messages, we still use this to ensure uniqueness
    // Format: userId1_userId2 (sorted)
    directId: {
      type: String,
      index: true,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookups
ConversationSchema.index({ members: 1 });
ConversationSchema.index({ updatedAt: -1 });

const Conversation = model("Conversation", ConversationSchema);
export default Conversation;
