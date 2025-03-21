import mongoose from "mongoose";
import { CatchError } from "../../configs/CatchError.js";
import Post from "../../models/mongodb/Posts.js";

const PostController = {
  GetAllPost: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalPosts = await Post.countDocuments();
      const totalPages = Math.ceil(totalPosts / limit);

      const posts = await Post.find()
        .populate({
          path: "user",
          select: "name followers following",
          populate: { path: "profile", select: "avatar" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      res.status(200).json({
        code: 1,
        posts,
        pagination: {
          page,
          limit,
          totalPosts,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({ code: 2, message: error.message });
    }
  },

  GetPostUserById: CatchError(async (req, res) => {
    const id = req.params.id;
    console.log(`Check id user from params ${id}`);
    if (!id) {
      return res.status(400).json({
        code: 0,
        message: "User ID is required!",
      });
    }
    const postOfUser = await Post.find({
      user: new mongoose.Types.ObjectId(id),
    })
      .populate({
        path: "user",
        select: "name ",
        populate: { path: "profile", select: "avatar" },
      })
      .sort({ createdAt: -1 })
      .lean();

    if (!postOfUser) {
      return res.status(404).json({
        code: 0,
        message: "No posts found for this user!",
      });
    }

    return res.status(200).json({
      code: 1,
      message: "Get posts of user successfully!",
      postOfUser,
    });
  }, "Get post of user failed !"),

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
      const userObjectId = new mongoose.Types.ObjectId(req.user.id);

      const { caption, tags } = req.body;

      if (!caption || caption.trim() === "") {
        return res.status(400).json({ code: 0, message: "Title là bắt buộc" });
      }

      const mediaPaths = req.files?.length
        ? req.files.map((file) => ({
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

      res.status(201).json({
        code: 1,
        message: "Post created successfully",
        post: populatedPost,
      });
    } catch (error) {
      console.error(" Error creating post:", error);
      res.status(500).json({ code: 0, message: error.message });
    }
  },
};

export default PostController;
