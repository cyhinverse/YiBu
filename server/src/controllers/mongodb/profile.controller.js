import ProfileService from "../../services/Profile.service.js";

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

      try {
        const profile = await ProfileService.getProfileById(id);

        res.status(200).json({
          code: 0,
          message: "Get profile successfully!",
          data: profile,
        });
      } catch (error) {
        if (
          error.message === "Profile not found" ||
          error.message === "Profile ID is required"
        ) {
          return res.status(404).json({
            code: 0,
            message: "Profile not found!",
          });
        }
        throw error;
      }
    } catch (error) {
      res.status(500).json({
        code: 0,
        message: error.message,
      });
    }
  },
};

export default ProfileController;
