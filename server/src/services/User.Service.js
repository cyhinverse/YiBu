import Users from "../models/mongodb/Users.js";

class UserService {
  static async findUserByEmail(email) {
    try {
      if (!email) {
        throw new Error("Email is required");
      }

      const user = await Users.findOne({ email });

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

  static async getUserById(userId) {
    try {
      const user = await Users.findById(userId);
      return user;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      throw new Error("Failed to get user");
    }
  }

  static async updateUser(userId, updateData) {
    try {
      const user = await Users.findByIdAndUpdate(userId, updateData, {
        new: true,
      });
      return user;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Failed to update user");
    }
  }

  static async deleteUser(userId) {
    try {
      const user = await Users.findByIdAndDelete(userId);
      return user;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error("Failed to delete user");
    }
  }

  static async getUsers() {
    try {
      const users = await Users.find();
      return users;
    } catch (error) {
      console.error("Error getting users:", error);
      throw new Error("Failed to get users");
    }
  }

  static async getUserByUsername(username) {
    try {
      const user = await Users.findOne({ username });
      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      throw new Error("Failed to get user");
    }
  }

  static async createUser(userData) {
    try {
      const user = await Users.create(userData);
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }

  static async getUserByEmail(email) {
    try {
      const user = await Users.findOne({ email });
      return user;
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw new Error("Failed to get user");
    }
  }
}

export default UserService;
