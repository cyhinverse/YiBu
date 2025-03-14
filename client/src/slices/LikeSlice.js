import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  likeList: [],
  loading: false,
  error: false,
};

const likeSlice = createSlice({
  name: "like",
  initialState,
  reducers: {
    GetAllLike: (state, action) => {
      state.likeList = action.payload;
      state.loading = false;
      state.error = false;
    },
    AddLike: (state, action) => {
      state.likeList.push(action.payload);
      state.loading = false;
      state.error = false;
    },
    RemoveLike: (state, action) => {
      const { userId } = action.payload;
      state.likeList = state.likeList.filter((like) => like.user !== userId);
      state.loading = false;
      state.error = false;
    },
  },
});

export const { GetAllLike, AddLike, RemoveLike } = likeSlice.actions;
export default likeSlice.reducer;
