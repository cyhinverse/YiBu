import { Schema, Types, model } from "mongoose";

const LikeSchema = new Schema({
  user: { type: Types.ObjectId, ref: "User", required: true },
  post: { type: Types.ObjectId, ref: "Post", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default Like = model("Like", LikeSchema);
