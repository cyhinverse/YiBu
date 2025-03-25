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
import AuthService from "../../services/Auth.Service.js";

const AuthController = {
  Register: async (req, res) => {
    try {
      console.log("Received register request:", req.body);
      const { name, email, password, username } = req.body;

      if (!name || !password || !email) {
        return res.status(400).json({
          code: 0,
          message: "Please fill all required fields",
        });
      }

      try {
        const user = await AuthService.registerUser(
          name,
          email,
          password,
          username
        );
        return res.status(201).json({
          code: 1,
          message: "User created successfully",
          user,
        });
      } catch (error) {
        if (
          error.message === "Email already in use." ||
          error.message ===
            "Username already in use. Please choose another one."
        ) {
          return res.status(400).json({
            code: 0,
            message: error.message,
          });
        }
        throw error;
      }
    } catch (e) {
      console.error("Registration error:", e);
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

      try {
        const { userData, accessToken } = await AuthService.loginUser(
          email,
          password
        );

        return res.status(200).json({
          code: 1,
          message: "Login successful",
          user: userData,
          accessToken,
        });
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: error.message,
        });
      }
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

      try {
        const { accessToken } = await AuthService.refreshUserToken(user.id);

        return res.status(200).json({
          code: 1,
          message: "Refresh token successfully!",
          accessToken,
        });
      } catch (error) {
        return res.status(400).json({
          code: 0,
          message: error.message,
        });
      }
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
      await AuthService.logoutUser(user.id);

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

      try {
        await AuthService.updateUserEmail(userId, email);

        return res.status(200).json({
          code: 1,
          message: "Email updated successfully",
        });
      } catch (error) {
        if (
          error.message === "Email is already in use" ||
          error.message === "User not found"
        ) {
          return res.status(400).json({
            code: 0,
            message: error.message,
          });
        }
        throw error;
      }
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

      try {
        await AuthService.updateUserPassword(
          userId,
          currentPassword,
          newPassword
        );

        return res.status(200).json({
          code: 1,
          message: "Password updated successfully",
        });
      } catch (error) {
        if (
          error.message === "Current password is incorrect" ||
          error.message === "User not found"
        ) {
          return res.status(400).json({
            code: 0,
            message: error.message,
          });
        }
        throw error;
      }
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
      const { password } = req.body;
      const userId = req.user.id;

      if (!password) {
        return res.status(400).json({
          code: 0,
          message: "Password is required to delete account",
        });
      }

      try {
        await AuthService.deleteUserAccount(userId, password);

        return res.status(200).json({
          code: 1,
          message: "Account deleted successfully",
        });
      } catch (error) {
        if (
          error.message === "Password is incorrect" ||
          error.message === "User not found"
        ) {
          return res.status(400).json({
            code: 0,
            message: error.message,
          });
        }
        throw error;
      }
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
