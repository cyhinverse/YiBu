import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  post: null,
  posts: [],
  error: false,
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    CreatePost: (state, action) => {
      state.post = action.payload;
      state.loading = false;
      state.error = false;
    },
    GetPostUserByID: (state, action) => {
      state.posts = action.payload;
      state.loading = false;
      state.error = false;
    },
  },
});

export const { CreatePost, GetPostUserByID } = postSlice.actions;
export default postSlice.reducer;
