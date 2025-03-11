import Profile from "../models/Profile.js";

class ProfileService {
  static async findProfileByUserId(userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const profile = await Profile.findOne({ userId });

      if (!profile) {
        console.error(`No profile found for user ID: ${userId}`);
        return null;
      }

      return profile;
    } catch (error) {
      console.error("Database error in findProfileByUserId:", error);
      throw new Error("Error finding profile");
    }
  }

  static async createProfile(profileData) {
    try {
      if (!profileData) {
        throw new Error("Profile data is required");
      }

      const profile = await Profile.create(profileData);
      return profile;
    } catch (error) {
      console.error("Database error in createProfile:", error);
      throw new Error("Error creating profile");
    }
  }

  static async updateProfile(userId, updateData) {
    try {
      if (!userId || !updateData) {
        throw new Error("User ID and update data are required");
      }

      const updatedProfile = await Profile.findOneAndUpdate(
        { userId },
        updateData,
        { new: true }
      );

      if (!updatedProfile) {
        console.error(`No profile found to update for user ID: ${userId}`);
        return null;
      }

      return updatedProfile;
    } catch (error) {
      console.error("Database error in updateProfile:", error);
      throw new Error("Error updating profile");
    }
  }

  static async deleteProfile(userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const deletedProfile = await Profile.findOneAndDelete({ userId });

      if (!deletedProfile) {
        console.error(`No profile found to delete for user ID: ${userId}`);
        return null;
      }

      return deletedProfile;
    } catch (error) {
      console.error("Database error in deleteProfile:", error);
      throw new Error("Error deleting profile");
    }
  }
}

export default ProfileService;
