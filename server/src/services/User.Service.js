import Users from "../models/Users.js";

class UserService {
  static async findUserByEmail(email) {
    try {
      if (!email) {
        throw new Error("Email is required");
      }

      const user = await Users.findOne({ email });

      // Don't expose error details to client, but log them
      if (!user) {
        console.error(`No user found with email: ${email}`);
        return null;
      }

      return user;
    } catch (error) {
      console.error("Database error in findUserByEmail:", error);
      throw new Error("Error finding user");
    }
  }
}

export default UserService;
