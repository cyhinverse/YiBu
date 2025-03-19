import { CatchError } from "../../configs/CatchError.js";
import Likes from "../../models/mongodb/Likes.js";
import { getIO } from "../../socket.js";
import mongoose from "mongoose";


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

    try {
 
      const session = await mongoose.startSession();
      session.startTransaction();

      try {

        const exists = await Likes.findOne({
          user: userId,
          post: postId,
        }).session(session);
        if (exists) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            code: 2,
            message: "You already liked this post",
          });
        }


        const newLike = new Likes({
          user: userId,
          post: postId,
        });
        await newLike.save({ session });


        const likeCount = await Likes.countDocuments({ post: postId }).session(
          session
        );


        await session.commitTransaction();
        session.endSession();


        const io = getIO();
        io.emit(`post:${postId}:likeUpdate`, {
          count: likeCount,
          isLiked: true,
        });


        console.log(
          `[Server] User ${userId} liked post ${postId}. New count: ${likeCount}`
        );


        return res.status(200).json({
          code: 1,
          message: "Liked successfully",
          data: {
            ...newLike.toJSON(),
            likeCount,
          },
        });
      } catch (error) {

        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error(`[Server] Error creating like:`, error);
      return res.status(500).json({
        code: 0,
        message: "Failed to like post",
        error: error.message,
      });
    }
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

    try {

      const session = await mongoose.startSession();
      session.startTransaction();

      try {

        const exists = await Likes.findOne({
          user: userId,
          post: postId,
        }).session(session);
        if (!exists) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            code: 2,
            message: "You have not liked this post",
          });
        }


        await Likes.deleteOne({ _id: exists._id }).session(session);


        const likeCount = await Likes.countDocuments({ post: postId }).session(
          session
        );


        await session.commitTransaction();
        session.endSession();

        const io = getIO();
        io.emit(`post:${postId}:likeUpdate`, {
          count: likeCount,
          isLiked: false,
        });


        console.log(
          `[Server] User ${userId} unliked post ${postId}. New count: ${likeCount}`
        );

        return res.status(200).json({
          code: 1,
          message: "Unlike successful",
          data: {
            likeCount,
          },
        });
      } catch (error) {

        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error(`[Server] Error deleting like:`, error);
      return res.status(500).json({
        code: 0,
        message: "Failed to unlike post",
        error: error.message,
      });
    }
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

    try {

      const like = await Likes.findOne({ user: userId, post: postId });


      const likeCount = await Likes.countDocuments({ post: postId });


      console.log(
        `[Server] Like status for post ${postId}, user ${userId}: isLiked=${!!like}, count=${likeCount}`
      );


      return res.status(200).json({
        code: 1,
        data: {
          isLiked: !!like,
          count: likeCount,
        },
      });
    } catch (error) {
      console.error(`[Server] Error getting like status:`, error);
      return res.status(500).json({
        code: 0,
        message: "Failed to get like status",
        error: error.message,
      });
    }
  }, "Failed to get like status"),


  GetAllLikeFromPosts: CatchError(async (req, res) => {
    const { postIds } = req.body;
    const userId = req.user.id;


    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        code: 3,
        message: "Valid post IDs array is required",
      });
    }

    try {

      const sanitizedPostIds = postIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );


      const likeCounts = await Likes.aggregate([
        {
          $match: {
            post: { $in: sanitizedPostIds },
          },
        },
        {
          $group: {
            _id: "$post",
            count: { $sum: 1 },
            likedByUser: {
              $sum: {
                $cond: [
                  { $eq: ["$user", new mongoose.Types.ObjectId(userId)] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);


      const formattedResults = postIds.reduce((acc, postId) => {
        const postLikes = likeCounts.find(
          (item) => item._id.toString() === postId.toString()
        ) || {
          count: 0,
          likedByUser: 0,
        };

        acc[postId] = {
          count: postLikes.count || 0,
          isLiked: postLikes.likedByUser > 0,
        };
        return acc;
      }, {});


      console.log(`[Server] GetAllLikeFromPosts response:`, formattedResults);


      return res.status(200).json({
        code: 1,
        data: formattedResults,
      });
    } catch (error) {
      console.error(`[Server] Error getting likes for posts:`, error);
      return res.status(500).json({
        code: 0,
        message: "Failed to get post likes",
        error: error.message,
      });
    }
  }, "Failed to get post likes"),
};

export default LikeController;
