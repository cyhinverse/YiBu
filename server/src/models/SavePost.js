import { Schema, Types, model } from "mongoose";

const SavePostSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    post: { type: Types.ObjectId, ref: "Post", required: true },
  },
  {
    collection: "SavePosts",
    timestamps: true,
  }
);

// Compound index to ensure uniqueness
SavePostSchema.index({ user: 1, post: 1 }, { unique: true });

const SavePost = model("SavePost", SavePostSchema);
export default SavePost;
