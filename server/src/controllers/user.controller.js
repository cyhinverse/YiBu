import checkComparePassword from "../helpers/CheckComparePassword.js";
import HashPasswordForUser from "../helpers/HashPassword.js";
import Users from "../models/Users.js";
import UserService from "../services/User.Service.js";

const UserController = {
  Register: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !password || !email) {
        return res.status(400).json({
          code: 0,
          message: "Please fill all fields",
        });
      }

      const oldUser = await UserService.findUserByEmail(email);
      if (oldUser) {
        return res.status(400).json({
          code: 0,
          message: "Email already in use.",
        });
      }
      const NewUser = new Users({
        name,
        password: await HashPasswordForUser(password),
        email,
      });
      await NewUser.save();
      return res.status(201).json({
        code: 1,
        message: "User created successfully",
        user: { name, email },
      });
    } catch (e) {
      return res.status(500).json({
        code: -1,
        message: "Server error",
        error: e.message,
      });
    }
  },
  Login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          code: 0,
          message: "Please fill all fields",
        });
      }

      const user = await Users.findOne({ email });
      if (!user) {
        return res.status(400).json({
          code: 0,
          message: "Invalid email or password",
        });
      }

      const isPasswordValid = await checkComparePassword(
        password,
        user.password
      );

      if (!isPasswordValid) {
        return res.status(400).json({
          code: 0,
          message: "Invalid email or password",
        });
      }

      return res.status(200).json({
        code: 1,
        message: "Login successful",
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        code: 0,
        message: "An error occurred during login",
      });
    }
  },
  RefreshToken: async (req, res) => {
    return res.status(200).json({
      code: 0,
      message: "Refresh token successfully !",
    });
  },
};

export default UserController;
