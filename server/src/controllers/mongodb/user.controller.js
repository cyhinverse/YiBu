import mongoose from "mongoose";
import Users from "../../models/mongodb/Users.js";

const UserController = {
  GET_TOP_USERS_BY_LIKES: async (req, res) => {
    try {
      const topUsers = await Users.aggregate([
        {
          $lookup: {
            from: "posts",
            localField: "_id",
            foreignField: "userId",
            as: "posts",
          },
        },
        {
          $addFields: {
            totalLikes: { $sum: "$posts.likes" },
          },
        },
        { $sort: { totalLikes: -1 } },
        { $limit: 10 },
        {
          $project: {
            name: 1,
            email: 1,
            totalLikes: 1,
          },
        },
      ]);

      return res.status(200).json({
        code: 1,
        users: topUsers,
      });
    } catch (error) {
      return res.status(500).json({
        code: -1,
        message: "Server error",
        error: error.message,
      });
    }
  },
  Get_User_By_Id: async (req, res) => {
    try {
      const { id } = req.params;
      console.log("check id", id);
      if (!id) {
        return res.status(400).json({
          code: 0,
          message: "User ID is required!",
        });
      }
      const user = await Users.findById(id).populate("profile").lean();
      if (!user) {
        return res.status(404).json({
          code: 0,
          message: "User not found!",
        });
      }
      return res.json({
        code: 1,
        message: "Get user successfully!",
        data: user,
      });
    } catch (error) {
      return res.json({
        code: 0,
        message: error.message,
      });
    }
  },
};

export default UserController;
