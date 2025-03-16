import { Schema, Types, model } from "mongoose";

const HashtagSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    posts: [{ type: Types.ObjectId, ref: "Post" }],
    usageCount: { type: Number, default: 0 },
  },
  {
    collection: "Hashtags",
    timestamps: true,
  }
);

export default Hashtag = model("Hashtag", HashtagSchema);
