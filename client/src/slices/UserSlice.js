import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  follower: [],
  user: null,
  loading: false,
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
} = userSlice.actions;
export default userSlice.reducer;
