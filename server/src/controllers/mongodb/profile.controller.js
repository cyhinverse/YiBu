import Profiles from "../../models/mongodb/Profiles.js";

const ProfileController = {
  GET_PROFILE_BY_ID: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          code: 0,
          message: "User ID is required!",
        });
      }
      const profile = await Profiles.findById(id).populate("userId").lean();
      if (!profile) {
        return res.status(404).json({
          code: 0,
          message: "Profile not found!",
        });
      }
      res.status(200).json({
        code: 0,
        message: "Get profile successfully!",
        data: profile,
      });
    } catch (error) {
      res.status(500).json({
        code: 0,
        message: error.message,
      });
    }
  },
};

export default ProfileController;
