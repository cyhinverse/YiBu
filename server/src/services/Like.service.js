import Likes from "../models/Likes.js";

class LikeService {
  static async createLike(userId, postId) {
    try {
      const newLike = await Likes.create({ userId, postId });
      return newLike;
    } catch (error) {
      console.error("Error creating like:", error);
      throw new Error("Failed to create like");
    }
  }

  static async getLikesByPostId(postId) {
    try {
      const likes = await Likes.find({ postId });
      return likes;
    } catch (error) {
      console.error("Error getting likes by post ID:", error);
      throw new Error("Failed to get likes");
    }
  }

  static async getLikesByUserId(userId) {
    try {
      const likes = await Likes.find({ userId });
      return likes;
    } catch (error) {
      console.error("Error getting likes by user ID:", error);
      throw new Error("Failed to get likes");
    }
  }

  static async deleteLike(likeId) {
    try {
      const deletedLike = await Likes.findByIdAndDelete(likeId);
      return deletedLike;
    } catch (error) {
      console.error("Error deleting like:", error);
      throw new Error("Failed to delete like");
    }
  }
}

export default LikeService;
