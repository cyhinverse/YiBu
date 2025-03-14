import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  commonPost: [],
  userPost: [],
  post: null,
  loading: false,
  error: null,
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    getAllPost: (state, action) => {
      state.commonPost = action.payload;
      state.loading = false;
      state.error = false;
    },
    addPost: (state, action) => {
      state.commonPost.unshift(action.payload);
      state.loading = false;
      state.error = false;
    },
  },
});

export const { getAllPost, addPost } = postSlice.actions;

export default postSlice.reducer;
