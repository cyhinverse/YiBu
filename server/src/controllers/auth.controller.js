import { CatchError } from "../configs/CatchError.js";
import AuthService from "../services/Auth.Service.js";
import { formatResponse } from "../helpers/formatResponse.js";
import logger from "../configs/logger.js";

const AuthController = {
  Register: CatchError(async (req, res) => {
    const { name, email, password, username } = req.body;

    if (!name || !password || !email) {
      const error = new Error("Please fill all required fields");
      error.statusCode = 400;
      throw error;
    }

    try {
      const user = await AuthService.registerUser(
        name,
        email,
        password,
        username
      );
      return formatResponse(res, 201, 1, "User created successfully", user);
    } catch (error) {
      if (
        error.message === "Email already in use." ||
        error.message === "Username already in use. Please choose another one."
      ) {
        error.statusCode = 400;
      }
      throw error;
    }
  }),

  Login: CatchError(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Please fill all fields");
      error.statusCode = 400;
      throw error;
    }

    try {
      const { userData, accessToken } = await AuthService.loginUser(
        email,
        password
      );

      return formatResponse(res, 200, 1, "Login successful", userData, { accessToken });
    } catch (error) {
      error.statusCode = 401;
      throw error;
    }
  }),

  RefreshToken: CatchError(async (req, res) => {
    const user = req.user;

    try {
      const { accessToken } = await AuthService.refreshUserToken(user.id);
      return formatResponse(res, 200, 1, "Refresh token successfully!", null, { accessToken });
    } catch (error) {
      error.statusCode = 400;
      throw error;
    }
  }),

  Logout: CatchError(async (req, res) => {
    const user = req.user;
    await AuthService.logoutUser(user.id);
    return formatResponse(res, 200, 1, "Logout successful");
  }),

  UpdateEmail: CatchError(async (req, res) => {
    const { email } = req.body;
    const userId = req.user.id;

    if (!email) {
      const error = new Error("Email is required");
      error.statusCode = 400;
      throw error;
    }

    try {
      await AuthService.updateUserEmail(userId, email);
      return formatResponse(res, 200, 1, "Email updated successfully");
    } catch (error) {
      if (
        error.message === "Email is already in use" ||
        error.message === "User not found"
      ) {
        error.statusCode = 400;
      }
      throw error;
    }
  }),

  UpdatePassword: CatchError(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      const error = new Error("Current password and new password are required");
      error.statusCode = 400;
      throw error;
    }

    try {
      await AuthService.updateUserPassword(
        userId,
        currentPassword,
        newPassword
      );
      return formatResponse(res, 200, 1, "Password updated successfully");
    } catch (error) {
      if (
        error.message === "Current password is incorrect" ||
        error.message === "User not found"
      ) {
        error.statusCode = 400;
      }
      throw error;
    }
  }),

  ConnectSocialAccount: CatchError(async (req, res) => {
    const { provider } = req.body;
    const userId = req.user.id;

    if (!provider) {
      const error = new Error("Provider is required");
      error.statusCode = 400;
      throw error;
    }

    try {
      await AuthService.connectSocialAccount(userId, provider);
      return formatResponse(res, 200, 1, `${provider} account connected successfully`);
    } catch (error) {
      if (error.message === "User not found") error.statusCode = 404;
      if (error.message.includes("already connected")) error.statusCode = 400;
      throw error;
    }
  }),

  VerifyAccount: CatchError(async (req, res) => {
    const userId = req.user.id;

    try {
      const user = await AuthService.verifyAccount(userId);
      // Giả lập gửi email xác thực
      // logger.info(`[Email Service] Verification email sent to ${user.email}`);

      return formatResponse(res, 200, 1, "Verification email sent successfully. Please check your inbox.", null, { sentTo: user.email });
    } catch (error) {
      if (error.message === "User not found") error.statusCode = 404;
      if (error.message === "Account is already verified") error.statusCode = 400;
      throw error;
    }
  }),

  DeleteAccount: CatchError(async (req, res) => {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      const error = new Error("Password is required to delete account");
      error.statusCode = 400;
      throw error;
    }

    try {
      await AuthService.deleteUserAccount(userId, password);
      return formatResponse(res, 200, 1, "Account deleted successfully");
    } catch (error) {
      if (
        error.message === "Password is incorrect" ||
        error.message === "User not found"
      ) {
        error.statusCode = 400;
      }
      throw error;
    }
  }),
};

export default AuthController;
