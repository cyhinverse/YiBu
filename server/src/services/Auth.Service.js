import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Users from "../models/mongodb/Users.js";
import RefreshToken from "../models/mongodb/RefreshToken.js";
import Profile from "../models/mongodb/Profiles.js";
import HashPasswordForUser from "../helpers/HashPassword.js";
import {
  GenerateAccessToken,
  GenerateRefreshToken,
} from "../helpers/GenerateTokens.js";

class AuthService {
  async registerUser(name, email, password, username = null) {
    try {
      // Kiểm tra xem email đã tồn tại chưa
      const oldUser = await Users.findOne({ email });
      if (oldUser) {
        throw new Error("Email already in use.");
      }

      // Tạo username từ email nếu không được cung cấp
      if (!username) {
        // Lấy phần trước @ của email và thêm số ngẫu nhiên
        username = email.split("@")[0] + Math.floor(Math.random() * 1000);

        // Kiểm tra xem username đã tồn tại chưa
        const existingUsername = await Users.findOne({ username });
        if (existingUsername) {
          // Nếu đã tồn tại, thêm thêm số ngẫu nhiên
          username = username + Math.floor(Math.random() * 1000);
        }
      }

      // Tạo user mới
      const hashedPassword = await HashPasswordForUser(password);
      const newUser = new Users({
        name,
        username,
        password: hashedPassword,
        email,
      });
      await newUser.save();

      return {
        name,
        email,
        username,
      };
    } catch (error) {
      console.error("Register user error:", error);
      throw error;
    }
  }

  async loginUser(email, password) {
    // Tìm user theo email
    const user = await Users.findOne({ email });
    if (!user) {
      throw new Error("Email hoặc mật khẩu không chính xác");
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Email hoặc mật khẩu không chính xác");
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

    // Lấy thông tin profile
    const userProfile = await Profile.findOne({ userId: user._id });

    // Tạo user data để trả về
    const userData = user.toObject();
    delete userData.password;

    if (userProfile) {
      userData.bio = userProfile.bio || "";
      userData.gender = userProfile.gender || "other";
      userData.birthday = userProfile.birthday || null;
      userData.website = userProfile.website || "";
      userData.interests = userProfile.interests || "";
    }

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

    const decoded = jwt.verify(latestToken, process.env.REFRESH_TOKEN_SECRET);

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
    return true;
  }

  async updateUserEmail(userId, email) {
    // Kiểm tra xem email đã được sử dụng chưa
    const existingUser = await Users.findOne({ email });
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new Error("Email is already in use");
    }

    // Cập nhật email
    const user = await Users.findByIdAndUpdate(
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
    const user = await Users.findById(userId);
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
    const user = await Users.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Password is incorrect");
    }

    // Xóa tài khoản
    await Users.findByIdAndDelete(userId);
    await Profile.findOneAndDelete({ userId });
    await RefreshToken.deleteMany({ userId });

    return true;
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      return decoded;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }
}

export default new AuthService();
