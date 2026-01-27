import { createSlice } from '@reduxjs/toolkit';
import {
  login,
  register,
  googleAuth,
  logout,
  logoutAll,
  updatePassword,
  requestPasswordReset,
  resetPassword,
  enable2FA,
  verify2FA,
  disable2FA,
  getSessions,
  revokeSession,
} from '@/redux/actions/authActions';

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  sessions: [],
  twoFactorEnabled: false,
  twoFactorPending: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setIsAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    resetAuthState: () => initialState,
  },
  extraReducers: builder => {
    builder
      // Login
      .addCase(login.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.twoFactorEnabled = action.payload?.twoFactorEnabled || false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Google Auth
      .addCase(googleAuth.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(googleAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, () => initialState)
      .addCase(logout.rejected, () => initialState)
      .addCase(logoutAll.fulfilled, () => initialState)
      // Update Password
      .addCase(updatePassword.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, state => {
        state.loading = false;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Password Reset Request
      .addCase(requestPasswordReset.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, state => {
        state.loading = false;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reset Password
      .addCase(resetPassword.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, state => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 2FA Enable
      .addCase(enable2FA.pending, state => {
        state.loading = true;
      })
      .addCase(enable2FA.fulfilled, state => {
        state.loading = false;
        state.twoFactorPending = true;
      })
      .addCase(enable2FA.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 2FA Verify
      .addCase(verify2FA.pending, state => {
        state.loading = true;
      })
      .addCase(verify2FA.fulfilled, state => {
        state.loading = false;
        state.twoFactorEnabled = true;
        state.twoFactorPending = false;
      })
      .addCase(verify2FA.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 2FA Disable
      .addCase(disable2FA.fulfilled, state => {
        state.twoFactorEnabled = false;
      })
      // Sessions
      .addCase(getSessions.fulfilled, (state, action) => {
        // Handle { sessions } or direct array
        state.sessions =
          action.payload?.sessions ||
          (Array.isArray(action.payload) ? action.payload : []);
      })
      .addCase(revokeSession.fulfilled, (state, action) => {
        state.sessions = state.sessions.filter(
          session => session.id !== action.payload.sessionId
        );
      });
  },
});

export const {
  clearError,
  setUser,
  setIsAuthenticated,
  updateUserProfile,
  resetAuthState,
} = authSlice.actions;
export default authSlice.reducer;
