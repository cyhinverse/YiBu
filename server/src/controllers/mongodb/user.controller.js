import mongoose from "mongoose";
import Users from "../../models/mongodb/Users.js";
import Profiles from "../../models/mongodb/Profiles.js";

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
      const id = req.params.id;
      console.log("check id", id);

      if (!id) {
        return res.status(400).json({
          code: 0,
          message: "User ID is required!",
        });
      }

      let user = await Users.findById(id)
        .populate("profile")
        .select("-password")
        .lean();

      console.log(`Check data:::`, user);

      if (!user) {
        return res.status(404).json({
          code: 0,
          message: "User not found!",
        });
      }

      // Nếu user chưa có profile, tạo profile mặc định
      if (!user.profile) {
        const newProfile = await Profiles.create({ userId: user._id });

        await Users.findByIdAndUpdate(id, { profile: newProfile._id });

        // Gán profile vào user để trả về dữ liệu đầy đủ
        user.profile = newProfile;
      }

      return res.json({
        code: 1,
        message: "Get user successfully!",
        data: user,
      });
    } catch (error) {
      return res.status(500).json({
        code: 0,
        message: error.message,
      });
    }
  },
};

export default UserController;
