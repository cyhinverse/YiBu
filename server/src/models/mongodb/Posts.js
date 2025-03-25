import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
    toObject: { virtuals: true }
  }
);

// Thêm virtual field cho likes
PostSchema.virtual('likes', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'post'
});

// Thêm virtual field cho comments
PostSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post'
});

const Post = mongoose.model("Post", PostSchema);
export default Post;
