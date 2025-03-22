import { CatchError } from "../../configs/CatchError.js";
import SavePost from "../../models/mongodb/SavePosts.js";
import Post from "../../models/mongodb/Posts.js";
import Notification from "../../models/mongodb/Notifications.js";
import { io } from "../../socket.js";

const SavePostController = {
  savePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({
        code: 0,
        message: "Post ID is required",
      });
    }

    try {
      // Kiểm tra post có tồn tại không
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          code: 0,
          message: "Bài viết không tồn tại",
        });
      }

      // Kiểm tra đã save chưa
      const existingSave = await SavePost.findOne({
        user: userId,
        post: postId,
      });
      if (existingSave) {
        return res.status(400).json({
          code: 0,
          message: "Bài viết đã được lưu trước đó",
        });
      }

      // Lưu bài viết
      const savedPost = await SavePost.create({ user: userId, post: postId });
      await savedPost.populate({
        path: "post",
        populate: {
          path: "user",
          select: "name avatar",
        },
      });

      // Tạo thông báo nếu người save không phải chủ bài viết
      if (post.user.toString() !== userId) {
        const notification = await Notification.create({
          recipient: post.user,
          sender: userId,
          type: "save",
          content: "đã lưu bài viết của bạn",
          post: postId,
        });

        // Gửi thông báo realtime
        await notification.populate({
          path: "sender",
          select: "username name avatar",
        });

        // Gửi thông báo đã được populate đầy đủ thông tin
        await notification.populate({
          path: "post",
          select: "caption media",
        });

        // Tạo object thông báo đầy đủ thông tin để gửi qua socket
        const notificationPayload = {
          ...notification.toObject(),
          content: `${
            req.user.username || "Một người dùng"
          } đã lưu bài viết của bạn`,
        };

        console.log("Emitting save notification:", notificationPayload);
        io.to(post.user.toString()).emit(
          "notification:new",
          notificationPayload
        );
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
  }, "Save post failed"),

  unsavePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({
        code: 0,
        message: "Post ID is required",
      });
    }

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
  }, "Unsave post failed"),

  getSavedPosts: CatchError(async (req, res) => {
    try {
      const userId = req.user.id;
      console.log("Getting saved posts for user:", userId);

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalSavedPosts = await SavePost.countDocuments({ user: userId });
      console.log("Total saved posts:", totalSavedPosts);

      const savedPosts = await SavePost.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "post",
          populate: {
            path: "user",
            select: "name avatar",
          },
        });

      console.log("Found saved posts:", savedPosts.length);
      console.log("Saved posts data:", JSON.stringify(savedPosts, null, 2));

      // Lọc ra những bài post không null
      const validPosts = savedPosts
        .map((sp) => sp.post)
        .filter((post) => post !== null);

      console.log("Valid posts:", validPosts.length);

      res.json({
        code: 1,
        savedPosts: validPosts,
        pagination: {
          page,
          limit,
          totalSavedPosts,
          totalPages: Math.ceil(totalSavedPosts / limit),
          hasMore: page < Math.ceil(totalSavedPosts / limit),
        },
      });
    } catch (error) {
      console.error("Error in getSavedPosts:", error);
      res.status(500).json({
        code: 0,
        message: "Lỗi khi lấy danh sách bài viết đã lưu",
        error: error.message,
      });
    }
  }, "Get saved posts failed"),

  checkSavedStatus: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({
        code: 0,
        message: "Post ID is required",
      });
    }

    const savedPost = await SavePost.findOne({
      user: userId,
      post: postId,
    });

    res.json({
      code: 1,
      isSaved: !!savedPost,
    });
  }, "Check saved status failed"),
};

export default SavePostController;
