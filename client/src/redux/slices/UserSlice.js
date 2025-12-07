import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  follower: [],
  user: null,
  loading: false,
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
    getAllUsers: (state, action) => {
      state.users = action.payload;
      state.loading = false;
    },

    getUserById: (state, action) => {
      state.user = action.payload;
      state.loading = false;
    },

    createUser: (state, action) => {
      state.users.push(action.payload);
    },

    updateUser: (state, action) => {
      const { userId, updatedData } = action.payload;
      const userIndex = state.users.findIndex((user) => user.id === userId);
      if (userIndex !== -1) {
        state.users[userIndex] = { ...state.users[userIndex], ...updatedData };
      }
    },

    deleteUser: (state, action) => {
      const userId = action.payload;
      state.users = state.users.filter((user) => user.id !== userId);
    },

    getFollowersByUserId: (state, action) => {
      const userId = action.payload;
      const user = state.users.find((user) => user.id === userId);
      state.user = user ? { ...user, followers: user.followers || [] } : null;
    },

    addFollower: (state, action) => {
      const { userId, followerId } = action.payload;
      const user = state.users.find((user) => user.id === userId);
      if (user && !user.followers.includes(followerId)) {
        user.followers.push(followerId);
      }
    },

    removeFollower: (state, action) => {
      const { userId, followerId } = action.payload;
      const user = state.users.find((user) => user.id === userId);
      if (user) {
        user.followers = user.followers.filter((id) => id !== followerId);
      }
    },
    
    setThemeSettings: (state, action) => {
      console.log('Redux: Setting theme settings', action.payload);
      
      // Make sure we have a valid payload
      if (!action.payload) {
        console.error('Redux: Invalid theme settings payload', action.payload);
        return;
      }
      
      state.settings = {
        ...state.settings,
        theme: action.payload
      };
      
      console.log('Redux: New state settings', state.settings);
    },
    
    setUserSettings: (state, action) => {
      state.settings = action.payload;
    },
  },
});

export const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getFollowersByUserId,
  addFollower,
  removeFollower,
  setThemeSettings,
  setUserSettings,
} = userSlice.actions;
export default userSlice.reducer;
