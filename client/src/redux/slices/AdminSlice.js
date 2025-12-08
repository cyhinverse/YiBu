import { createSlice } from "@reduxjs/toolkit";
import {
  getDashboardStats,
  getRecentActivities,
  getAllUsersAdmin,
  getUserDetailsAdmin,
  deleteUserAdmin,
  banUser,
  unbanUser,
  getAllPostsAdmin,
  deletePostAdmin,
  approvePost,
  getAllCommentsAdmin,
  deleteCommentAdmin,
  getAllReportsAdmin,
  resolveReport,
  dismissReport,
} from "../actions/adminActions";

const initialState = {
  stats: {},
  activities: [],
  users: [],
  posts: [],
  comments: [],
  reports: [],
  userDetails: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  }
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAdminState: () => initialState
  },
  extraReducers: (builder) => {
    // Dashboard Stats
    builder
        .addCase(getDashboardStats.fulfilled, (state, action) => {
            state.stats = action.payload;
        });

    // Recent Activities
    builder
        .addCase(getRecentActivities.fulfilled, (state, action) => {
            state.activities = action.payload;
        });
        
    // Users
    builder
        .addCase(getAllUsersAdmin.pending, (state) => {
            state.loading = true;
        })
        .addCase(getAllUsersAdmin.fulfilled, (state, action) => {
            state.loading = false;
            // Adjust based on actual API response structure (e.g., data.users, data.pagination)
            const { users, pagination } = action.payload || {};
            state.users = users || action.payload || []; 
            if (pagination) state.pagination = pagination;
        })
        .addCase(getAllUsersAdmin.rejected, (state, action) => {
             state.loading = false;
             state.error = action.payload;
        });
        
    // User Details
    builder
        .addCase(getUserDetailsAdmin.fulfilled, (state, action) => {
            state.userDetails = action.payload;
        });

    // Ban/Unban/Delete User (Simpler handling: finding and updating local state or refetching)
    builder.addCase(banUser.fulfilled, () => {
         // Optionally update user status in state.users list
    });
    builder.addCase(unbanUser.fulfilled, () => {
         // Optionally update user status in state.users list
    });
    builder.addCase(deleteUserAdmin.fulfilled, (state, action) => {
         state.users = state.users.filter(u => u.id !== action.payload);
    });

    // Posts
    builder
        .addCase(getAllPostsAdmin.pending, (state) => {
             state.loading = true;
        })
        .addCase(getAllPostsAdmin.fulfilled, (state, action) => {
             state.loading = false;
             const { posts, pagination } = action.payload || {};
             state.posts = posts || action.payload || [];
             if (pagination) state.pagination = pagination;
        })
        .addCase(getAllPostsAdmin.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    
    builder.addCase(deletePostAdmin.fulfilled, (state, action) => {
         state.posts = state.posts.filter(p => p._id !== action.payload);
    });
    
    builder.addCase(approvePost.fulfilled, () => {
         // Update post status
    });

    // Comments
    builder
        .addCase(getAllCommentsAdmin.fulfilled, (state, action) => {
             const { comments, pagination } = action.payload || {};
             state.comments = comments || action.payload || [];
             if (pagination) state.pagination = pagination;
        });
        
    builder.addCase(deleteCommentAdmin.fulfilled, (state, action) => {
         state.comments = state.comments.filter(c => c._id !== action.payload);
    });

    // Reports
    builder
        .addCase(getAllReportsAdmin.fulfilled, (state, action) => {
             const { reports, pagination } = action.payload || {};
             state.reports = reports || action.payload || [];
             if (pagination) state.pagination = pagination;
        });
        
    builder.addCase(resolveReport.fulfilled, () => {
         // Update report status
    });
    builder.addCase(dismissReport.fulfilled, () => {
         // Update report status
    });
  }
});

export const { clearError, resetAdminState } = adminSlice.actions;
export default adminSlice.reducer;
