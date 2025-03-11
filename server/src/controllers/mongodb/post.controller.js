import Post from "../../models/mongodb/Posts.js";

const PostController = {
  GetAllPost: async (req, res) => {
    try {
      const posts = await Post.find();
      res.status(200).json({ code: 1, posts });
    } catch (error) {
      res.status(500).json({ code: 2, message: error.message });
    }
  },
  GetPostPostUserById: async (req, res) => {
    try {
      const userId = req.user.id;

      const post = await Post.find({ userId });

      if (!post)
        return res.status(404).json({ code: 0, message: "Post not found" });
      res.status(200).json({ code: 1, post });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  DeletePost: async (req, res) => {
    try {
      const { id } = req.params;
      const post = await Post.findByIdAndDelete(id);
      if (!post)
        return res.status(404).json({ code: 0, message: "Post not found" });
      res.status(200).json({ code: 1, message: "Post deleted successfully" });
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
      const { title, image, video, tags } = req.body;
      console.log(req.body);
      const userId = req.user.id;

      if (!title) {
        return res.status(400).json({ code: 0, message: "Title là bắt buộc" });
      }

      const mediaPaths = req.files.map((file) => file.path);

      const newPost = new Post({
        userId,
        title,
        image: mediaPaths[0] || null,
        video: mediaPaths.find((path) => path.includes("mp4")) || null,
        tags: Array.isArray(tags) ? tags : [],
      });

      await newPost.save();
      res
        .status(201)
        .json({ code: 1, message: "Post created successfully", post: newPost });
    } catch (error) {
      res.status(500).json({ code: 0, message: error.message });
    }
  },
};

export default PostController;
