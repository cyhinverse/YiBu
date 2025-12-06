import { Schema, Types, model } from "mongoose";

const LikeSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    post: { type: Types.ObjectId, ref: "Post", required: true },
  },
  {
    timestamps: true,
    collection: "Likes",
  }
);

LikeSchema.index({ user: 1, post: 1 }, { unique: true });

const Like = model("Like", LikeSchema);
export default Like;
