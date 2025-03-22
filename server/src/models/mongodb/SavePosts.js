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

// Thêm compound index để đảm bảo mỗi user chỉ save một post một lần
SavePostSchema.index({ user: 1, post: 1 }, { unique: true });

const SavePost = model("SavePost", SavePostSchema);
export default SavePost;
