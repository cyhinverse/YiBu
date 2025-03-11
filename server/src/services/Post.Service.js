import Posts from "../models/Posts.js";

class PostService {
  static async createPost(postData) {
    try {
      const post = await Posts.create(postData);
      return post;
    } catch (error) {
      console.error("Error creating post:", error);
      throw new Error("Failed to create post");
    }
  }

  static async getPostsByUserId(userId) {
    try {
      const posts = await Posts.find({ userId });
      return posts;
    } catch (error) {
      console.error("Error getting posts by user ID:", error);
      throw new Error("Failed to get posts");
    }
  }

  static async deletePost(postId) {
    try {
      const post = await Posts.findByIdAndDelete(postId);
      return post;
    } catch (error) {
      console.error("Error deleting post:", error);
      throw new Error("Failed to delete post");
    }
  }

  static async updatePost(postId, updateData) {
    try {
      const post = await Posts.findByIdAndUpdate(postId, updateData, {
        new: true,
      });
      return post;
    } catch (error) {
      console.error("Error updating post:", error);
      throw new Error("Failed to update post");
    }
  }

  static async getPostById(postId) {
    try {
      const post = await Posts.findById(postId);
      return post;
    } catch (error) {
      console.error("Error getting post by ID:", error);
      throw new Error("Failed to get post");
    }
  }

  static async getPostsByUserId(userId) {
    try {
      const posts = await Posts.find({ userId });
      return posts;
    } catch (error) {
      console.error("Error getting posts by user ID:", error);
      throw new Error("Failed to get posts");
    }
  }

  
}

export default PostService;
