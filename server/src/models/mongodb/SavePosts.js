import { Schema, Types, model } from "mongoose";

const SavePostSchema = new Schema({
  user: { type: Types.ObjectId, ref: "User", required: true },
  post: { type: Types.ObjectId, ref: "Post", required: true },
  savedAt: { type: Date, default: Date.now },
});

export default SavePost = model("SavePost", SavePostSchema);
