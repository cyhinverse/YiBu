import { createSlice } from "@reduxjs/toolkit";
import {
  getAllPost,
  createPost,
  getPostUserById,
  deletePost,
} from "../actions/postActions";

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
    resetPagination: (state) => {
      state.pagination = {
        page: 1,
        limit: 10,
        totalPosts: 0,
        totalPages: 0,
        hasMore: true,
      };
      state.commonPost = []; 
    },
    setUserPosts: (state, action) => {
      state.userPost = action.payload;
    },
    // We can keep these if we want to manually manipulate state without API calls
    removePostLocal: (state, action) => {
       const postId = action.payload;
       state.commonPost = state.commonPost.filter((post) => post._id !== postId);
       state.userPost = state.userPost.filter((post) => post._id !== postId);
    }
  },
  extraReducers: (builder) => {
    // getAllPost
    builder
      .addCase(getAllPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllPost.fulfilled, (state, action) => {
        const { posts = [], pagination = {} } = action.payload;

        if (pagination.page === 1) {
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
      })
      .addCase(getAllPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // createPost
    builder
      .addCase(createPost.fulfilled, (state, action) => {
        if (!action.payload) return;
        const isDuplicate = state.commonPost.some(
            (post) => post._id === action.payload._id
        );
        if (!isDuplicate) {
             state.commonPost.unshift(action.payload);
        }
        state.loading = false;
      })
      .addCase(createPost.rejected, (state, action) => {
         state.error = action.payload; 
      });

    // getPostUserById
    builder
      .addCase(getPostUserById.pending, (state) => {
          state.loading = true;
      })
      .addCase(getPostUserById.fulfilled, (state, action) => {
          state.userPost = action.payload || [];
          state.loading = false;
      })
      .addCase(getPostUserById.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
      });

    // deletePost
    builder
      .addCase(deletePost.fulfilled, (state, action) => {
          const postId = action.payload;
          state.commonPost = state.commonPost.filter((post) => post._id !== postId);
          state.userPost = state.userPost.filter((post) => post._id !== postId);
      });
  },
});

export const { setLoading, resetPagination, removePostLocal, setUserPosts } = postSlice.actions;
export default postSlice.reducer;
