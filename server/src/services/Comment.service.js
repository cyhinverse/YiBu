import Comments from "../models/Comments.js";

class CommentService {
  static async createComment(commentData) {
    try {
      if (!commentData) {
        throw new Error("Comment data is required");
      }

      const comment = await Comments.create(commentData);
      return comment;
    } catch (error) {
      console.error("Database error in createComment:", error);
      throw new Error("Error creating comment");
    }
  }

  static async getCommentsByPostId(postId) {
    try {
      if (!postId) {
        throw new Error("Post ID is required");
      }

      const comments = await Comments.find({ postId });
      return comments;
    } catch (error) {
      console.error("Database error in getCommentsByPostId:", error);
      throw new Error("Error getting comments");
    }
  }

  static async deleteComment(commentId) {
    try {
      if (!commentId) {
        throw new Error("Comment ID is required");
      }

      const comment = await Comments.findByIdAndDelete(commentId);
      return comment;
    } catch (error) {
      console.error("Database error in deleteComment:", error);
      throw new Error("Error deleting comment");
    }
  }

  static async updateComment(commentId, updateData) {
    try {
      if (!commentId || !updateData) {
        throw new Error("Comment ID and update data are required");
      }

      const comment = await Comments.findByIdAndUpdate(commentId, updateData, {
        new: true,
      });
      return comment;
    } catch (error) {
      console.error("Database error in updateComment:", error);
      throw new Error("Error updating comment");
    }
  }
}

export default CommentService;
