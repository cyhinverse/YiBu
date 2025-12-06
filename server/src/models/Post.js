import { Schema, Types, model } from "mongoose";

const PostSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    caption: { type: String },
    media: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video"], required: true },
      },
    ],
  },
  {
    timestamps: true,
    collection: "Posts",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for likes
PostSchema.virtual("likes", {
  ref: "Like",
  localField: "_id",
  foreignField: "post",
});

// Virtual field for comments
PostSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "post",
});

const Post = model("Post", PostSchema);
export default Post;
