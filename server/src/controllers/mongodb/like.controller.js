import { CatchError } from "../../configs/CatchError.js";
import Likes from "../../models/mongodb/Likes.js";
import { getIO } from "../../socket.js";

const LikeController = {
  CreateLike: CatchError(async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({
        code: 3,
        message: "Post ID is required",
      });
    }

    const exists = await Likes.findOne({ user: userId, post: postId });
    if (exists) {
      return res.status(400).json({
        code: 2,
        message: "You already liked this post",
      });
    }

    const newLike = new Likes({
      user: userId,
      post: postId,
    });
    await newLike.save();

    // Lấy số lượng like mới và emit tới tất cả clients
    const likeCount = await Likes.countDocuments({ post: postId });
    const io = getIO();
    io.emit(`post:${postId}:likeUpdate`, likeCount);

    return res.status(200).json({
      code: 1,
      message: "Liked successfully",
      data: newLike,
    });
  }, "Failed to like post"),

  DeleteLike: CatchError(async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({
        code: 3,
        message: "Post ID is required",
      });
    }

    const exists = await Likes.findOne({ user: userId, post: postId });
    if (!exists) {
      return res.status(400).json({
        code: 2,
        message: "You have not liked this post",
      });
    }

    await Likes.deleteOne({ _id: exists._id });

    // Lấy số lượng like mới và emit tới tất cả clients
    const likeCount = await Likes.countDocuments({ post: postId });
    const io = getIO();
    io.emit(`post:${postId}:likeUpdate`, likeCount);

    return res.status(200).json({
      code: 1,
      message: "Unlike successful",
    });
  }, "Failed to unlike post"),

  GetLikeStatus: CatchError(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({
        code: 3,
        message: "Post ID is required",
      });
    }

    const like = await Likes.findOne({ user: userId, post: postId });

    return res.status(200).json({
      code: 1,
      data: {
        isLiked: !!like,
      },
    });
  }, "Failed to get like status"),

  GetAllLikeFromPosts: CatchError(async (req, res) => {
    const { postIds } = req.body;

    if (!postIds || !Array.isArray(postIds)) {
      return res.status(400).json({
        code: 3,
        message: "Post IDs array is required",
      });
    }

    const likeCounts = await Likes.aggregate([
      {
        $match: {
          post: { $in: postIds },
        },
      },
      {
        $group: {
          _id: "$post",
          likeCount: { $sum: 1 },
          likedBy: { $push: "$user" },
        },
      },
    ]);

    // Convert to a more friendly format
    const formattedResults = postIds.reduce((acc, postId) => {
      const postLikes = likeCounts.find(
        (item) => item._id.toString() === postId.toString()
      ) || {
        likeCount: 0,
        likedBy: [],
      };

      acc[postId] = {
        count: postLikes.likeCount,
        likedBy: postLikes.likedBy,
      };
      return acc;
    }, {});

    return res.status(200).json({
      code: 1,
      data: formattedResults,
    });
  }, "Failed to get post likes"),
};

export default LikeController;
