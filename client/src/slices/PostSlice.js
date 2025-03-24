import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  commonPost: [],
  userPost: [],
  post: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalPosts: 0,
    totalPages: 0,
    hasMore: true,
  },
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    getAllPost: (state, action) => {
      if (!action.payload || typeof action.payload !== "object") {
        state.loading = false;
        state.error = true;
        return;
      }

      const { posts = [], pagination = {} } = action.payload;

      if (!pagination.page || pagination.page === 1) {
        state.commonPost = posts;
      } else {
        const newPosts = posts.filter(
          (newPost) =>
            !state.commonPost.some(
              (existingPost) => existingPost._id === newPost._id
            )
        );
        state.commonPost = [...state.commonPost, ...newPosts];
      }

      state.pagination = {
        ...state.pagination,
        ...pagination,
      };
      state.loading = false;
      state.error = false;
    },
    getPostUserById: (state, action) => {
      state.userPost = action.payload || [];
      state.loading = false;
      state.error = false;
    },
    addPost: (state, action) => {
      if (!action.payload) return;

      const isDuplicate = state.commonPost.some(
        (post) => post._id === action.payload._id
      );
      if (!isDuplicate) {
        state.commonPost.unshift(action.payload);
      }
      state.loading = false;
      state.error = false;
    },
    removePost: (state, action) => {
      const postId = action.payload;
      // Xóa bài viết khỏi danh sách bài viết chung
      state.commonPost = state.commonPost.filter((post) => post._id !== postId);
      // Xóa bài viết khỏi danh sách bài viết của người dùng
      state.userPost = state.userPost.filter((post) => post._id !== postId);
    },
    resetPagination: (state) => {
      state.pagination = {
        page: 1,
        limit: 10,
        totalPosts: 0,
        totalPages: 0,
        hasMore: true,
      };
    },
  },
});

export const {
  getAllPost,
  addPost,
  getPostUserById,
  setLoading,
  resetPagination,
  removePost,
} = postSlice.actions;
export default postSlice.reducer;
