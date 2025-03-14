import checkComparePassword from "../../helpers/CheckComparePassword.js";
import {
  GenerateAccessToken,
  GenerateRefreshToken,
} from "../../helpers/GenerateTokens.js";
import HashPasswordForUser from "../../helpers/HashPassword.js";
import RefreshToken from "../../models/mongodb/RefreshToken.js";
import Users from "../../models/mongodb/Users.js";
import UserService from "../../services/User.Service.js";
import jwt from "jsonwebtoken";
const AuthController = {
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
      const payload = {
        id: user._id,
        role: user.role,
      };

      const accessToken = GenerateAccessToken(payload);
      const refreshToken = GenerateRefreshToken(payload);

      const newToken = new RefreshToken({
        token: refreshToken,
        userId: user._id,
      });
      await newToken.save();

      const { password: _, ...userWithoutPassword } = user.toObject();
      return res.status(200).json({
        code: 1,
        message: "Login successful",
        user: userWithoutPassword,
        accessToken,
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
    try {
      const user = req.user;
      let refreshTokenDoc = await RefreshToken.findOne({ userId: user.id });

      if (!refreshTokenDoc) {
        return res.status(400).json({
          code: 0,
          message: "Refresh token not found",
        });
      }

      const latestToken = Array.isArray(refreshTokenDoc.token)
        ? refreshTokenDoc.token[refreshTokenDoc.token.length - 1]
        : refreshTokenDoc.token;

      const decoded = jwt.verify(latestToken, process.env.REFRESH_TOKEN_SECRET);

      const accessToken = GenerateAccessToken(decoded);
      const newRefreshToken = GenerateRefreshToken(decoded);

      refreshTokenDoc.token.push(newRefreshToken);

      if (refreshTokenDoc.token.length > 5) {
        refreshTokenDoc.token.shift();
      }

      await refreshTokenDoc.save();

      return res.status(200).json({
        code: 1,
        message: "Refresh token successfully!",
        accessToken,
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      return res.status(500).json({
        code: 0,
        message: "An error occurred during token refresh",
      });
    }
  },

  Logout: async (req, res) => {
    try {
      const user = req.user;
      await RefreshToken.deleteMany({ userId: user.id });
      return res.status(200).json({
        code: 1,
        message: "Logout successful",
      });
    } catch (error) {
      return res.status(500).json({
        code: -1,
        message: "Server error",
        error: error.message,
      });
    }
  },
  
};

export default AuthController;
