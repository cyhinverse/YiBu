import { CatchError } from "../../configs/CatchError.js";
import Likes from "../../models/mongodb/Likes.js";

const LikeController = {
  CreateLike: CatchError(async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;

    console.log("userId :>> ", userId);
    console.log("postId :>> ", postId);

    const exists = await Likes.findOne({ user: userId, post: postId });
    if (exists) {
      return res
        .status(400)
        .json({ code: 2, message: "You already liked this post !" });
    }

    const newLike = new Likes({
      user: userId,
      post: postId,
    });
    await newLike.save();

    return res.status(200).json({
      message: "Liked successfully!",
      newLike,
    });
  }, "Failed to like post!"),

  DeleteLike: CatchError(async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;

    const exists = await Likes.findOne({ user: userId, post: postId });
    if (!exists) {
      return res.status(400).json({
        code: 2,
        message: "You have not liked this post!",
      });
    }

    await Likes.deleteOne({ _id: exists._id });

    return res.status(200).json({
      code: 1,
      message: "Deleted like successfully!",
    });
  }, "Failed to delete like!"),
};

export default LikeController;
