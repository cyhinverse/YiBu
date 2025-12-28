import { createSlice } from '@reduxjs/toolkit';
import {
  searchUsers,
  getSuggestions,
  getProfile,
  updateProfile,
  getUserById,
  checkFollowStatus,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
  getBlockedUsers,
  blockUser,
  unblockUser,
  getMutedUsers,
  muteUser,
  unmuteUser,
  getSettings,
  updatePrivacySettings,
  updateNotificationSettings,
  updateSecuritySettings,
  updateContentSettings,
  updateThemeSettings,
} from '@/redux/actions/userActions';

const initialState = {
  currentProfile: null,
  searchResults: [],
  suggestions: [],
  followers: [],
  following: [],
  followRequests: [],
  blockedUsers: [],
  mutedUsers: [],
  settings: null,
  followStatus: {},
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    clearSearchResults: state => {
      state.searchResults = [];
    },
    setCurrentProfile: (state, action) => {
      state.currentProfile = action.payload.user || action.payload;
    },
    updateFollowStatus: (state, action) => {
      const { userId, isFollowing } = action.payload;
      state.followStatus[userId] = isFollowing;
    },
    resetUserState: () => initialState,
  },
  extraReducers: builder => {
    builder
      // Search Users
      .addCase(searchUsers.pending, state => {
        state.loading = true;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.loading = false;
        // Extract users array from response
        const data = action.payload;
        state.searchResults =
          data?.users || data?.data?.users || (Array.isArray(data) ? data : []);
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Suggestions
      .addCase(getSuggestions.fulfilled, (state, action) => {
        // Extract users array from response
        const data = action.payload;
        state.suggestions =
          data?.users ||
          data?.suggestions ||
          data?.data?.users ||
          (Array.isArray(data) ? data : []);
      })
      // Get Profile
      .addCase(getProfile.pending, state => {
        state.loading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Data is already extracted by extractData helper
        state.currentProfile = action.payload.user || action.payload;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, state => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Data is already extracted
        const updatedUser = action.payload.user || action.payload;
        state.currentProfile = { ...state.currentProfile, ...updatedUser };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get User By ID
      .addCase(getUserById.fulfilled, (state, action) => {
        state.currentProfile = action.payload;
      })
      // Check Follow Status
      .addCase(checkFollowStatus.fulfilled, (state, action) => {
        state.followStatus[action.payload.userId] = action.payload.isFollowing;
      })
      // Follow User
      .addCase(followUser.fulfilled, (state, action) => {
        state.followStatus[action.payload.userId] = true;
        if (state.currentProfile?.id === action.payload.userId) {
          state.currentProfile.followersCount =
            (state.currentProfile.followersCount || 0) + 1;
        }
      })
      // Unfollow User
      .addCase(unfollowUser.fulfilled, (state, action) => {
        state.followStatus[action.payload.userId] = false;
        if (state.currentProfile?.id === action.payload.userId) {
          state.currentProfile.followersCount = Math.max(
            (state.currentProfile.followersCount || 1) - 1,
            0
          );
        }
      })
      // Get Followers
      .addCase(getFollowers.fulfilled, (state, action) => {
        // Handle { users, total, hasMore } or direct array
        state.followers =
          action.payload?.users ||
          action.payload?.followers ||
          (Array.isArray(action.payload) ? action.payload : []);
      })
      // Get Following
      .addCase(getFollowing.fulfilled, (state, action) => {
        // Handle { users, total, hasMore } or direct array
        state.following =
          action.payload?.users ||
          action.payload?.following ||
          (Array.isArray(action.payload) ? action.payload : []);
      })
      // Follow Requests
      .addCase(getFollowRequests.fulfilled, (state, action) => {
        // Handle { requests, total, hasMore } or direct array
        state.followRequests =
          action.payload?.requests ||
          action.payload?.followRequests ||
          (Array.isArray(action.payload) ? action.payload : []);
      })
      .addCase(acceptFollowRequest.fulfilled, (state, action) => {
        state.followRequests = state.followRequests.filter(
          req => req.id !== action.payload.requestId
        );
      })
      .addCase(rejectFollowRequest.fulfilled, (state, action) => {
        state.followRequests = state.followRequests.filter(
          req => req.id !== action.payload.requestId
        );
      })
      // Blocked Users
      .addCase(getBlockedUsers.fulfilled, (state, action) => {
        // Handle { users } or direct array
        state.blockedUsers =
          action.payload?.users ||
          action.payload?.blockedUsers ||
          (Array.isArray(action.payload) ? action.payload : []);
      })
      .addCase(blockUser.fulfilled, (state, action) => {
        state.blockedUsers.push(action.payload.user);
      })
      .addCase(unblockUser.fulfilled, (state, action) => {
        state.blockedUsers = state.blockedUsers.filter(
          user => user.id !== action.payload.userId
        );
      })
      // Muted Users
      .addCase(getMutedUsers.fulfilled, (state, action) => {
        // Handle { users } or direct array
        state.mutedUsers =
          action.payload?.users ||
          action.payload?.mutedUsers ||
          (Array.isArray(action.payload) ? action.payload : []);
      })
      .addCase(muteUser.fulfilled, (state, action) => {
        state.mutedUsers.push(action.payload.user);
      })
      .addCase(unmuteUser.fulfilled, (state, action) => {
        state.mutedUsers = state.mutedUsers.filter(
          user => user.id !== action.payload.userId
        );
      })
      // Settings
      .addCase(getSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      .addCase(updatePrivacySettings.fulfilled, (state, action) => {
        if (state.settings) {
          state.settings.privacy = action.payload;
        }
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        if (state.settings) {
          state.settings.notifications = action.payload;
        }
      })
      .addCase(updateSecuritySettings.fulfilled, (state, action) => {
        if (state.settings) {
          state.settings.security = action.payload;
        }
      })
      .addCase(updateContentSettings.fulfilled, (state, action) => {
        if (state.settings) {
          state.settings.content = action.payload;
        }
      })
      .addCase(updateThemeSettings.fulfilled, (state, action) => {
        if (state.settings) {
          state.settings.theme = action.payload;
        }
      });
  },
});

export const {
  clearError,
  clearSearchResults,
  setCurrentProfile,
  updateFollowStatus,
  resetUserState,
} = userSlice.actions;
export default userSlice.reducer;
