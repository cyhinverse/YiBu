import Hashtags from "../models/Hashtags.js";

class HashtagService {
  static async findHashtagByName(name) {
    try {
      if (!name) {
        throw new Error("Hashtag name is required");
      }

      const hashtag = await Hashtags.findOne({ name });

      if (!hashtag) {
        console.error(`No hashtag found with name: ${name}`);
        return null;
      }

      return hashtag;
    } catch (error) {
      console.error("Database error in findHashtagByName:", error);
      throw new Error("Error finding hashtag");
    }
  }
}

export default HashtagService;
