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
import bcrypt from "bcrypt";
import Profile from "../../models/mongodb/Profiles.js";

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

      // Tạo user mới
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
        return res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác",
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

      const userProfile = await Profile.findOne({ userId: user._id });

      const userData = user.toObject();
      delete userData.password;

      if (userProfile) {
        userData.bio = userProfile.bio || "";
        userData.gender = userProfile.gender || "other";
        userData.birthday = userProfile.birthday || null;
        userData.website = userProfile.website || "";
        userData.interests = userProfile.interests || "";
      }

      return res.status(200).json({
        code: 1,
        message: "Login successful",
        user: userData,
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

  // New methods for account settings
  UpdateEmail: async (req, res) => {
    try {
      const { email } = req.body;
      const userId = req.user.id;

      if (!email) {
        return res.status(400).json({
          code: 0,
          message: "Email is required",
        });
      }

      // Check if email is already in use
      const existingUser = await UserService.findUserByEmail(email);
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({
          code: 0,
          message: "Email is already in use",
        });
      }

      // Update the user's email
      const user = await Users.findByIdAndUpdate(
        userId,
        { email },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          code: 0,
          message: "User not found",
        });
      }

      return res.status(200).json({
        code: 1,
        message: "Email updated successfully",
      });
    } catch (error) {
      console.error("Update email error:", error);
      return res.status(500).json({
        code: 0,
        message: "An error occurred while updating email",
      });
    }
  },

  UpdatePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          code: 0,
          message: "Current password and new password are required",
        });
      }

      // Get the user
      const user = await Users.findById(userId);
      if (!user) {
        return res.status(404).json({
          code: 0,
          message: "User not found",
        });
      }

      // Verify current password
      const isPasswordValid = await checkComparePassword(
        currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        return res.status(400).json({
          code: 0,
          message: "Current password is incorrect",
        });
      }

      // Hash the new password
      const hashedPassword = await HashPasswordForUser(newPassword);

      // Update the password
      user.password = hashedPassword;
      await user.save();

      return res.status(200).json({
        code: 1,
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error("Update password error:", error);
      return res.status(500).json({
        code: 0,
        message: "An error occurred while updating password",
      });
    }
  },

  ConnectSocialAccount: async (req, res) => {
    try {
      const { provider } = req.body;
      const userId = req.user.id;

      if (!provider) {
        return res.status(400).json({
          code: 0,
          message: "Provider is required",
        });
      }

      // Get the user
      const user = await Users.findById(userId);
      if (!user) {
        return res.status(404).json({
          code: 0,
          message: "User not found",
        });
      }

      // Update the user's connected accounts
      // Note: This is a simple implementation. In a real world scenario,
      // you would handle OAuth flows with the provider
      if (!user.connectedAccounts) {
        user.connectedAccounts = [];
      }

      // Check if the account is already connected
      if (user.connectedAccounts.includes(provider)) {
        return res.status(400).json({
          code: 0,
          message: `${provider} account is already connected`,
        });
      }

      user.connectedAccounts.push(provider);
      await user.save();

      return res.status(200).json({
        code: 1,
        message: `${provider} account connected successfully`,
      });
    } catch (error) {
      console.error("Connect social account error:", error);
      return res.status(500).json({
        code: 0,
        message: "An error occurred while connecting social account",
      });
    }
  },

  VerifyAccount: async (req, res) => {
    try {
      const userId = req.user.id;

      // Get the user
      const user = await Users.findById(userId);
      if (!user) {
        return res.status(404).json({
          code: 0,
          message: "User not found",
        });
      }

      // Check if the user is already verified
      if (user.isVerified) {
        return res.status(400).json({
          code: 0,
          message: "Account is already verified",
        });
      }

      // Giả lập gửi email xác thực (implementation note)
      // Trong môi trường thực tế, bạn sẽ tích hợp dịch vụ email như Nodemailer hoặc SendGrid
      console.log(
        `[Email Service] Sending verification email to: ${user.email}`
      );
      console.log(
        `[Email Service] Verification link: https://yourdomain.com/verify?token=${userId}`
      );

      // Cập nhật trạng thái mà không xác thực schema
      await Users.findByIdAndUpdate(
        userId,
        {
          verificationRequested: true,
          verificationRequestDate: new Date(),
        },
        {
          new: true,
          runValidators: false,
        }
      );

      return res.status(200).json({
        code: 1,
        message:
          "Verification email sent successfully. Please check your inbox.",
        sentTo: user.email,
      });
    } catch (error) {
      console.error("Verify account error:", error);
      return res.status(500).json({
        code: 0,
        message: "An error occurred while sending verification email",
        error: error.message,
      });
    }
  },

  DeleteAccount: async (req, res) => {
    try {
      const userId = req.user.id;

      // Delete refresh tokens
      await RefreshToken.deleteMany({ userId });

      // Delete the user
      const user = await Users.findByIdAndDelete(userId);
      if (!user) {
        return res.status(404).json({
          code: 0,
          message: "User not found",
        });
      }

      return res.status(200).json({
        code: 1,
        message: "Account deleted successfully",
      });
    } catch (error) {
      console.error("Delete account error:", error);
      return res.status(500).json({
        code: 0,
        message: "An error occurred while deleting account",
      });
    }
  },
};

export default AuthController;
