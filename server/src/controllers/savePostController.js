import SavePost from "../models/SavePost.js";
import Post from "../models/Post.js";
import Notification from "../models/Notification.js";
import { io } from "../socket.js";

const savePostController = {
  savePost: async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      // Kiểm tra post có tồn tại không
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          code: 0,
          message: "Bài viết không tồn tại",
        });
      }

      // Tạo hoặc lấy saved post
      const savedPost = await SavePost.findOneAndUpdate(
        { user: userId, post: postId },
        { user: userId, post: postId },
        { upsert: true, new: true }
      ).populate({
        path: "post",
        populate: {
          path: "user",
          select: "name avatar",
        },
      });

      // Tạo thông báo nếu người save không phải chủ bài viết
      if (post.user.toString() !== userId.toString()) {
        const notification = await Notification.create({
          recipient: post.user,
          sender: userId,
          type: "SAVE",
          content: "đã lưu bài viết của bạn",
          post: postId,
        });

        // Populate sender info cho notification
        await notification.populate("sender", "name avatar");

        // Gửi thông báo realtime
        io.to(post.user.toString()).emit("notification:new", notification);
      }

      res.json({
        code: 1,
        message: "Đã lưu bài viết",
        savedPost,
      });
    } catch (error) {
      console.error("Save post error:", error);
      res.status(500).json({
        code: 0,
        message: "Lỗi server",
      });
    }
  },

  unsavePost: async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      const result = await SavePost.findOneAndDelete({
        user: userId,
        post: postId,
      });

      if (!result) {
        return res.status(404).json({
          code: 0,
          message: "Bài viết chưa được lưu",
        });
      }

      res.json({
        code: 1,
        message: "Đã bỏ lưu bài viết",
      });
    } catch (error) {
      console.error("Unsave post error:", error);
      res.status(500).json({
        code: 0,
        message: "Lỗi server",
      });
    }
  },

  getSavedPosts: async (req, res) => {
    try {
      const userId = req.user._id;
      const savedPosts = await SavePost.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate({
          path: "post",
          populate: {
            path: "user",
            select: "name avatar",
          },
        });

      res.json({
        code: 1,
        savedPosts: savedPosts.map((sp) => sp.post),
      });
    } catch (error) {
      console.error("Get saved posts error:", error);
      res.status(500).json({
        code: 0,
        message: "Lỗi server",
      });
    }
  },

  checkSavedStatus: async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      const savedPost = await SavePost.findOne({
        user: userId,
        post: postId,
      });

      res.json({
        code: 1,
        isSaved: !!savedPost,
      });
    } catch (error) {
      console.error("Check saved status error:", error);
      res.status(500).json({
        code: 0,
        message: "Lỗi server",
      });
    }
  },
};

export default savePostController;
