import Post from "../models/post.model.js";

const PostController = {
  GetAllPost: async (req, res) => {
    try {
      const posts = await Post.find();
      res.status(200).json(posts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  GetPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: "Post not found" });
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  DeletePost: async (req, res) => {
    try {
      const post = await Post.findByIdAndDelete(req.params.id);
      if (!post) return res.status(404).json({ message: "Post not found" });
      res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  UpdatePost: async (req, res) => {
    try {
      const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (!post) return res.status(404).json({ message: "Post not found" });
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  CreatePost: async (req, res) => {
    try {
      const newPost = new Post(req.body);
      await newPost.save();
      res.status(201).json(newPost);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

export default PostController;
