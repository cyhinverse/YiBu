import { createSlice } from "@reduxjs/toolkit";
import {
  getAllUsers,
  getUserById,
  searchUsers,
  updateUser,
  deleteUser,
  followUser,
  unfollowUser,
  getFollowersByUserId,
} from "../actions/userActions";

const initialState = {
  users: [],
  searchResults: [],
  follower: [],
  user: null,
  loading: false,
  error: null,
  settings: {
    theme: {
      appearance: "system",
      primaryColor: "#4f46e5",
      fontSize: "medium",
    }
  }
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setThemeSettings: (state, action) => {
      console.log('Redux: Setting theme settings', action.payload);
      if (!action.payload) {
        console.error('Redux: Invalid theme settings payload', action.payload);
        return;
      }
      state.settings = {
        ...state.settings,
        theme: action.payload
      };
    },
    setUserSettings: (state, action) => {
      state.settings = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // getAllUsers
    builder
      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // getUserById
    builder
      .addCase(getUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // searchUsers
    builder
      .addCase(searchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // updateUser
    builder
      .addCase(updateUser.fulfilled, (state, action) => {
        const { userId, updatedData } = action.payload;
        // Update in users list
        const userIndex = state.users.findIndex((u) => u.id === userId);
        if (userIndex !== -1) {
          state.users[userIndex] = { ...state.users[userIndex], ...updatedData };
        }
        // Update if it's the current user
        if (state.user && state.user.id === userId) {
          state.user = { ...state.user, ...updatedData };
        }
      });

    // deleteUser
    builder
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((user) => user.id !== action.payload);
      });

    // followUser
    builder.addCase(followUser.fulfilled, () => {
        // Logic depends on what backend returns. Assuming it returns the updated user or success
        // If necessary, update state.user or state.users
    });

    // unfollowUser
    builder.addCase(unfollowUser.fulfilled, () => {
        // Logic depends on what backend returns
    });
    
    // getFollowersByUserId
    builder.addCase(getFollowersByUserId.fulfilled, (state, action) => {
        const { userId, followers } = action.payload;
         if (state.user && state.user.id === userId) {
             state.user.followers = followers;
         }
         // Also update in users list if needed
         const user = state.users.find(u => u.id === userId);
         if (user) {
             user.followers = followers;
         }
    });
  },
});

export const {
  setThemeSettings,
  setUserSettings,
  clearError
} = userSlice.actions;

export default userSlice.reducer;
