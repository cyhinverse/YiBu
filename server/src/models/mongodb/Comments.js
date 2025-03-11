import { Schema, Types, model } from "mongoose";

const CommentSchema = new Schema({
  user: { type: Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  parentComment: { type: Types.ObjectId, ref: "Comment", default: null }, // Comment cha
  post: { type: Types.ObjectId, ref: "Post", required: true }, // Gắn với bài viết
  createdAt: { type: Date, default: Date.now },
});

export default Comment = model("Comment", CommentSchema);
