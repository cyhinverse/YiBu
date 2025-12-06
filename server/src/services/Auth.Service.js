import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../configs/config.js";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import HashPasswordForUser from "../helpers/HashPassword.js";
import {
  GenerateAccessToken,
  GenerateRefreshToken,
} from "../helpers/GenerateTokens.js";
import logger from "../configs/logger.js";

class AuthService {
  async registerUser(name, email, password, username = null) {
    try {
      // Kiểm tra xem email đã tồn tại chưa
      const oldUser = await User.findOne({ email });
      if (oldUser) {
        throw new Error("Email already in use.");
      }

      // Tạo username từ email nếu không được cung cấp
      if (!username) {
        // Lấy phần trước @ của email và thêm số ngẫu nhiên
        username = email.split("@")[0] + Math.floor(Math.random() * 1000);

        // Kiểm tra xem username đã tồn tại chưa
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
          // Nếu đã tồn tại, thêm thêm số ngẫu nhiên
          username = username + Math.floor(Math.random() * 1000);
        }
      }

      // Tạo user mới
      const hashedPassword = await HashPasswordForUser(password);
      const newUser = new User({
        name,
        username,
        password: hashedPassword,
        email,
        profile: {
          bio: "",
          website: "",
          interests: "",
          // Social links logic can be added if needed, schema supports embedded profile
        }
      });
      await newUser.save();

      // Log user registration
      logger.info(
        `New user registered: ${newUser.email}`,
        {
          user: newUser._id,
          module: "auth",
          username: newUser.username,
          name: newUser.name,
        }
      );

      return {
        name,
        email,
        username,
      };
    } catch (error) {
      logger.error("Register user error:", error);
      throw error;
    }
  }

  async loginUser(email, password) {
    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Kiểm tra xem user có bị khóa không
    if (user.moderation?.isBanned) {
      const banReason = user.moderation.banReason || "violating our terms of service";
      const banMessage = user.moderation.banExpiration
        ? `Your account is temporarily banned until ${new Date(
            user.moderation.banExpiration
          ).toLocaleDateString()} for ${banReason}`
        : `Your account has been permanently banned for ${banReason}`;

      // Log failed login attempt for banned user
      logger.warn(
        `Banned user attempted to login: ${user.email}`,
        {
          user: user._id,
          module: "auth",
          reason: "banned_user",
          banExpiration: user.moderation.banExpiration,
          banReason: user.moderation.banReason,
        }
      );

      throw new Error(banMessage);
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Log failed login attempt
      logger.warn(
        `Invalid password for user: ${user.email}`,
        {
          user: user._id,
          module: "auth",
          reason: "invalid_password",
        }
      );
      throw new Error("Invalid email or password");
    }

    // Xác định quyền admin
    const isUserAdmin = user.isAdmin || user.role === "admin";

    // Tạo payload cho token
    const payload = {
      id: user._id,
      role: user.role || "user",
      isAdmin: isUserAdmin,
    };

    // Tạo access token và refresh token
    const accessToken = GenerateAccessToken(payload);
    const refreshToken = GenerateRefreshToken(payload);

    // Lưu refresh token vào database
    const newToken = new RefreshToken({
      token: refreshToken,
      userId: user._id,
    });
    await newToken.save();

    // Tạo user data để trả về (đã bao gồm profile embedded)
    const userData = user.toObject();
    delete userData.password;

    // Log successful login
    logger.info(
      `User logged in successfully: ${user.email}`,
      {
        user: user._id,
        module: "auth",
      }
    );

    return {
      userData,
      accessToken,
    };
  }

  async refreshUserToken(userId) {
    let refreshTokenDoc = await RefreshToken.findOne({ userId });

    if (!refreshTokenDoc) {
      throw new Error("Refresh token not found");
    }

    const latestToken = Array.isArray(refreshTokenDoc.token)
      ? refreshTokenDoc.token[refreshTokenDoc.token.length - 1]
      : refreshTokenDoc.token;

    const decoded = jwt.verify(latestToken, config.jwt.refreshSecret);

    const accessToken = GenerateAccessToken(decoded);
    const newRefreshToken = GenerateRefreshToken(decoded);

    refreshTokenDoc.token.push(newRefreshToken);

    if (refreshTokenDoc.token.length > 5) {
      refreshTokenDoc.token.shift();
    }

    await refreshTokenDoc.save();

    return { accessToken };
  }

  async logoutUser(userId) {
    await RefreshToken.deleteMany({ userId });
    logger.info(`User logged out successfully`, {
      user: userId,
      module: "auth",
    });
    return true;
  }

  async updateUserEmail(userId, email) {
    // Kiểm tra xem email đã được sử dụng chưa
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new Error("Email is already in use");
    }

    // Cập nhật email
    const user = await User.findByIdAndUpdate(
      userId,
      { email },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async updateUserPassword(userId, currentPassword, newPassword) {
    // Lấy thông tin user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error("Current password is incorrect");
    }

    // Hash mật khẩu mới
    const hashedPassword = await HashPasswordForUser(newPassword);

    // Cập nhật mật khẩu
    user.password = hashedPassword;
    await user.save();

    return true;
  }

  async deleteUserAccount(userId, password) {
    // Tìm user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Password is incorrect");
    }

    // Xóa tài khoản
    await User.findByIdAndDelete(userId);
    await RefreshToken.deleteMany({ userId });

    return true;
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      return decoded;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }
  async connectSocialAccount(userId, provider) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.connectedAccounts) {
      user.connectedAccounts = [];
    }

    if (user.connectedAccounts.includes(provider)) {
      throw new Error(`${provider} account is already connected`);
    }

    user.connectedAccounts.push(provider);
    await user.save();
    return user;
  }

  async verifyAccount(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isVerified) {
      throw new Error("Account is already verified");
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        verificationRequested: true,
        verificationRequestDate: new Date(),
      },
      { new: true, runValidators: false }
    );
    
    return updatedUser;
  }
}

export default new AuthService();
