import { CatchError } from "../../configs/CatchError.js";
import PostService from "../../services/Post.Service.js";

const PostController = {
  GetAllPost: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await PostService.getAllPosts(page, limit);

      res.status(200).json({
        code: 1,
        ...result,
      });
    } catch (error) {
      res.status(500).json({ code: 2, message: error.message });
    }
  },

  GetPostUserById: CatchError(async (req, res) => {
    const id = req.params.id;
    console.log(`Check id user from params ${id}`);

    try {
      const postOfUser = await PostService.getPostsByUserId(id);

      return res.status(200).json({
        code: 1,
        message: "Get posts of user successfully!",
        postOfUser,
      });
    } catch (error) {
      if (error.message === "User ID is required!") {
        return res.status(400).json({
          code: 0,
          message: error.message,
        });
      } else if (error.message === "No posts found for this user!") {
        return res.status(404).json({
          code: 0,
          message: error.message,
        });
      } else {
        throw error;
      }
    }
  }, "Get post of user failed !"),

  DeletePost: async (req, res) => {
    try {
      const { id } = req.params;
      await PostService.deletePost(id);
      res.status(200).json({ code: 1, message: "Post deleted successfully" });
    } catch (error) {
      if (error.message === "Post not found") {
        return res.status(404).json({ code: 0, message: "Post not found" });
      }
      res.status(500).json({ message: error.message });
    }
  },

  UpdatePost: async (req, res) => {
    try {
      const post = await PostService.updatePost(req.params.id, req.body);
      res.status(200).json(post);
    } catch (error) {
      if (error.message === "Post not found") {
        return res.status(404).json({ message: "Post not found" });
      }
      res.status(500).json({ message: error.message });
    }
  },

  CreatePost: async (req, res) => {
    try {
      const post = await PostService.createPost(req.user, req.body, req.files);

      res.status(201).json({
        code: 1,
        message: "Post created successfully",
        post: post,
      });
    } catch (error) {
      if (error.message === "Title là bắt buộc") {
        return res.status(400).json({ code: 0, message: error.message });
      }
      console.error(" Error creating post:", error);
      res.status(500).json({ code: 0, message: error.message });
    }
  },
};

export default PostController;
