import { createSlice } from "@reduxjs/toolkit";
import {
  login,
  register,
  logout,
  refreshToken,
  updateEmail,
  updatePassword,
  deleteAccount
} from "../actions/authActions";

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
        loading: false,
        error: null,
      };
    } catch (error) {
      console.error("Error parsing stored user:", error);
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
    }
  }

  return {
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
  };
};

const initialState = getInitialAuthState();

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Keep manual reducers if needed, e.g. for immediate state updates without API
    resetError: (state) => {
        state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        
        // Destructure payload. Assuming payload is { code, message, accessToken, user }
        const { user, accessToken } = action.payload || {};
        
        // Correctly set state: user should only be the user profile
        // If 'user' exists in payload, use it. Otherwise fallback to payload IF it looks like a user object, 
        // but given the bug, we must be careful.
        state.user = user || action.payload; 

        // Update localStorage for persistence across reloads (and for axios)
        if (accessToken) {
            localStorage.setItem("accessToken", accessToken);
        }
        
        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
        } else if (action.payload) {
             // Fallback: If payload IS the user object (no wrapper), store it.
             // But we suspect payload is a wrapper.
             // We'll store what we put in state.user
             localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Register
    builder
        .addCase(register.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(register.fulfilled, (state, action) => {
            state.loading = false;
            state.isAuthenticated = false;
            state.user = action.payload; // Or null if we don't want to store registered user details yet
        })
        .addCase(register.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

    // Logout
    builder
        .addCase(logout.fulfilled, (state) => {
            state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");
        })
        .addCase(logout.rejected, (state) => {
            // Even if api fails, we clear state
             state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");
        });
        
    // Refresh Token
    builder.addCase(refreshToken.fulfilled, (state, action) => {
        // Update token in localStorage if returned
         if (action.payload && action.payload.accessToken) {
             localStorage.setItem("accessToken", action.payload.accessToken);
         }
    });

    // Delete Account
    builder.addCase(deleteAccount.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
    });
  },
});

export const { resetError } = authSlice.actions;

export default authSlice.reducer;
