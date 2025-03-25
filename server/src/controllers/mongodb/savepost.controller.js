import { CatchError } from "../../configs/CatchError.js";
import SavePostService from "../../services/SavePost.service.js";
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
      // Sử dụng service để lưu bài viết
      const { post, savedPost } = await SavePostService.savePost(
        userId,
        postId
      );

      // Tạo thông báo nếu người save không phải chủ bài viết
      if (post.user.toString() !== userId) {
        const { notificationPayload } =
          await SavePostService.createSaveNotification(
            post.user,
            userId,
            postId,
            req.user.username
          );

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
        message: error.message || "Lỗi server",
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

    try {
      await SavePostService.unsavePost(userId, postId);

      res.json({
        code: 1,
        message: "Đã bỏ lưu bài viết",
      });
    } catch (error) {
      if (error.message === "Bài viết chưa được lưu") {
        return res.status(404).json({
          code: 0,
          message: error.message,
        });
      }
      throw error;
    }
  }, "Unsave post failed"),

  getSavedPosts: CatchError(async (req, res) => {
    try {
      const userId = req.user.id;
      console.log("Getting saved posts for user:", userId);

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const { validPosts, pagination } = await SavePostService.getSavedPosts(
        userId,
        page,
        limit
      );

      console.log("Found saved posts:", validPosts.length);

      res.json({
        code: 1,
        savedPosts: validPosts,
        pagination,
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

    const isSaved = await SavePostService.checkSavedStatus(userId, postId);

    res.json({
      code: 1,
      isSaved,
    });
  }, "Check saved status failed"),
};

export default SavePostController;
