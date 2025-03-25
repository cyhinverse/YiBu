import mongoose from "mongoose";
import Post from "../models/mongodb/Posts.js";

class PostService {
  static async getAllPosts(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const totalPosts = await Post.countDocuments();
      const totalPages = Math.ceil(totalPosts / limit);

      const posts = await Post.find()
        .populate({
          path: "user",
          select: "name followers following avatar",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return {
        posts,
        pagination: {
          page,
          limit,
          totalPosts,
          totalPages,
          hasMore: page < totalPages,
        },
      };
    } catch (error) {
      console.error("Error getting all posts:", error);
      throw error;
    }
  }

  static async getPostsByUserId(userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required!");
      }

      const postOfUser = await Post.find({
        user: new mongoose.Types.ObjectId(userId),
      })
        .populate({
          path: "user",
          select: "name ",
          populate: { path: "profile", select: "avatar" },
        })
        .sort({ createdAt: -1 })
        .lean();

      if (!postOfUser) {
        throw new Error("No posts found for this user!");
      }

      return postOfUser;
    } catch (error) {
      console.error("Error getting posts by user ID:", error);
      throw error;
    }
  }

  static async deletePost(postId) {
    try {
      const post = await Post.findByIdAndDelete(postId);
      if (!post) {
        throw new Error("Post not found");
      }
      return post;
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  }

  static async updatePost(postId, updateData) {
    try {
      const post = await Post.findByIdAndUpdate(postId, updateData, {
        new: true,
      });
      if (!post) {
        throw new Error("Post not found");
      }
      return post;
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  }

  static async createPost(userData, postData, files) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userData.id);
      const { caption, tags } = postData;

      if (!caption || caption.trim() === "") {
        throw new Error("Title là bắt buộc");
      }

      const mediaPaths = files?.length
        ? files.map((file) => ({
            url: file.path,
            type: file.mimetype.includes("image") ? "image" : "video",
          }))
        : [];

      const newPost = new Post({
        user: userObjectId,
        caption: caption,
        media: mediaPaths,
        tags: Array.isArray(tags) ? tags : [],
      });

      await newPost.save();

      const populatedPost = await Post.findById(newPost._id)
        .populate("user", "name followers following")
        .lean();

      return populatedPost;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  }

  static async getPostById(postId) {
    try {
      const post = await Post.findById(postId)
        .populate("user", "name followers following")
        .lean();
      if (!post) {
        throw new Error("Post not found");
      }
      return post;
    } catch (error) {
      console.error("Error getting post by ID:", error);
      throw error;
    }
  }
}

export default PostService;
