import { createSlice } from "@reduxjs/toolkit";

// Kiểm tra nếu có thông tin user trong localStorage
const getInitialAuthState = () => {
  const token = localStorage.getItem("accessToken");
  const storedUser = localStorage.getItem("user");

  if (token && storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return {
        isAuthenticated: true,
        user: user,
      };
    } catch (error) {
      console.error("Error parsing stored user:", error);
      // Nếu có lỗi khi parse, xóa dữ liệu hỏng và bắt đầu lại
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
    }
  }

  return {
    isAuthenticated: false,
    user: null,
  };
};

const initialState = getInitialAuthState();

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    register: (state, action) => {
      state.isAuthenticated = false;
      state.user = action.payload;
    },
    logout: (state) => {
      // Xóa thông tin khỏi localStorage khi đăng xuất
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      state.isAuthenticated = false;
      state.user = null;
    },
  },
});

export const { login, logout, register } = authSlice.actions;

export default authSlice.reducer;
