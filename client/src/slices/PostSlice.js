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
      const uniquePosts = [
        ...new Map(action.payload.map((post) => [post._id, post])).values(),
      ];
      state.commonPost = uniquePosts;
      state.loading = false;
      state.error = false;
    },
    getPostUserById: (state, action) => {
      state.userPost = action.payload;
      state.loading = false;
      state.error = false;
    },
    addPost: (state, action) => {
      const isDuplicate = state.commonPost.some(
        (post) => post._id === action.payload._id
      );
      if (!isDuplicate) {
        state.commonPost.unshift(action.payload);
      }
      state.loading = false;
      state.error = false;
    },
  },
});

export const { getAllPost, addPost, getPostUserById } = postSlice.actions;
export default postSlice.reducer;
