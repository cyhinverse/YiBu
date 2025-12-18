import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../axios/axiosConfig';
import { USER_API } from '../../axios/apiEndpoint';

// Helper to extract data from response
// Server returns { code, message, data } format, we need to extract the actual data
const extractData = response => {
  const responseData = response.data;
  return responseData?.data !== undefined ? responseData.data : responseData;
};

// Search Users
export const searchUsers = createAsyncThunk(
  'user/searchUsers',
  async ({ query, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(USER_API.SEARCH, {
        params: { q: query, page, limit },
      });
      const data = extractData(response);
      return { ...data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Tìm kiếm người dùng thất bại'
      );
    }
  }
);

// Get Suggestions
export const getSuggestions = createAsyncThunk(
  'user/getSuggestions',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await api.get(USER_API.SUGGESTIONS, {
        params: { limit },
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy gợi ý người dùng thất bại'
      );
    }
  }
);

// Get Profile by ID
export const getProfile = createAsyncThunk(
  'user/getProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(USER_API.GET_PROFILE(userId));
      return extractData(response);
    } catch (error) {
      console.error('getProfile error:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Lấy thông tin cá nhân thất bại'
      );
    }
  }
);

// Update Profile
export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put(USER_API.UPDATE_PROFILE, profileData);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Cập nhật thông tin thất bại'
      );
    }
  }
);

// Get User by ID
export const getUserById = createAsyncThunk(
  'user/getUserById',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(USER_API.GET_BY_ID(userId));
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy thông tin người dùng thất bại'
      );
    }
  }
);

// Follow User
export const followUser = createAsyncThunk(
  'user/followUser',
  async (targetUserId, { rejectWithValue }) => {
    try {
      const response = await api.post(USER_API.FOLLOW, { targetUserId });
      const data = extractData(response);
      return { userId: targetUserId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Theo dõi người dùng thất bại'
      );
    }
  }
);

// Unfollow User
export const unfollowUser = createAsyncThunk(
  'user/unfollowUser',
  async (targetUserId, { rejectWithValue }) => {
    try {
      await api.post(USER_API.UNFOLLOW, { targetUserId });
      return { userId: targetUserId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Bỏ theo dõi người dùng thất bại'
      );
    }
  }
);

// Check Follow Status
export const checkFollowStatus = createAsyncThunk(
  'user/checkFollowStatus',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(USER_API.CHECK_FOLLOW(userId));
      const data = extractData(response);
      return { userId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Kiểm tra trạng thái theo dõi thất bại'
      );
    }
  }
);

// Get Followers
export const getFollowers = createAsyncThunk(
  'user/getFollowers',
  async ({ userId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(USER_API.GET_FOLLOWERS(userId), {
        params: { page, limit },
      });
      const data = extractData(response);
      return { ...data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy danh sách người theo dõi thất bại'
      );
    }
  }
);

// Get Following
export const getFollowing = createAsyncThunk(
  'user/getFollowing',
  async ({ userId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(USER_API.GET_FOLLOWING(userId), {
        params: { page, limit },
      });
      const data = extractData(response);
      return { ...data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy danh sách đang theo dõi thất bại'
      );
    }
  }
);

// Get Follow Requests
export const getFollowRequests = createAsyncThunk(
  'user/getFollowRequests',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(USER_API.GET_FOLLOW_REQUESTS, {
        params: { page, limit },
      });
      const data = extractData(response);
      return { ...data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Lấy danh sách yêu cầu theo dõi thất bại'
      );
    }
  }
);

// Accept Follow Request
export const acceptFollowRequest = createAsyncThunk(
  'user/acceptFollowRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      await api.post(USER_API.ACCEPT_FOLLOW_REQUEST(requestId));
      return { requestId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Chấp nhận yêu cầu theo dõi thất bại'
      );
    }
  }
);

// Reject Follow Request
export const rejectFollowRequest = createAsyncThunk(
  'user/rejectFollowRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      await api.post(USER_API.REJECT_FOLLOW_REQUEST(requestId));
      return { requestId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Từ chối yêu cầu theo dõi thất bại'
      );
    }
  }
);

// Block User
export const blockUser = createAsyncThunk(
  'user/blockUser',
  async (userId, { rejectWithValue }) => {
    try {
      await api.post(USER_API.BLOCK_USER(userId));
      return { userId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Chặn người dùng thất bại'
      );
    }
  }
);

// Unblock User
export const unblockUser = createAsyncThunk(
  'user/unblockUser',
  async (userId, { rejectWithValue }) => {
    try {
      await api.delete(USER_API.UNBLOCK_USER(userId));
      return { userId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Bỏ chặn người dùng thất bại'
      );
    }
  }
);

// Get Blocked Users
export const getBlockedUsers = createAsyncThunk(
  'user/getBlockedUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(USER_API.GET_BLOCKED);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy danh sách người bị chặn thất bại'
      );
    }
  }
);

// Mute User
export const muteUser = createAsyncThunk(
  'user/muteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await api.post(USER_API.MUTE_USER(userId));
      return { userId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ẩn người dùng thất bại'
      );
    }
  }
);

// Unmute User
export const unmuteUser = createAsyncThunk(
  'user/unmuteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await api.delete(USER_API.UNMUTE_USER(userId));
      return { userId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Bỏ ẩn người dùng thất bại'
      );
    }
  }
);

// Get Muted Users
export const getMutedUsers = createAsyncThunk(
  'user/getMutedUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(USER_API.GET_MUTED);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy danh sách người bị ẩn thất bại'
      );
    }
  }
);

// Get Settings
export const getSettings = createAsyncThunk(
  'user/getSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(USER_API.GET_SETTINGS);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy cài đặt thất bại'
      );
    }
  }
);

// Update Privacy Settings
export const updatePrivacySettings = createAsyncThunk(
  'user/updatePrivacySettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await api.put(USER_API.UPDATE_PRIVACY, settings);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Cập nhật cài đặt quyền riêng tư thất bại'
      );
    }
  }
);

// Update Notification Settings
export const updateNotificationSettings = createAsyncThunk(
  'user/updateNotificationSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await api.put(USER_API.UPDATE_NOTIFICATIONS, settings);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Cập nhật cài đặt thông báo thất bại'
      );
    }
  }
);

// Update Security Settings
export const updateSecuritySettings = createAsyncThunk(
  'user/updateSecuritySettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await api.put(USER_API.UPDATE_SECURITY, settings);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Cập nhật cài đặt bảo mật thất bại'
      );
    }
  }
);

// Update Content Settings
export const updateContentSettings = createAsyncThunk(
  'user/updateContentSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await api.put(USER_API.UPDATE_CONTENT, settings);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Cập nhật cài đặt nội dung thất bại'
      );
    }
  }
);

// Update Theme Settings
export const updateThemeSettings = createAsyncThunk(
  'user/updateThemeSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await api.put(USER_API.UPDATE_THEME, settings);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Cập nhật cài đặt giao diện thất bại'
      );
    }
  }
);

// Add Device
export const addDevice = createAsyncThunk(
  'user/addDevice',
  async (deviceData, { rejectWithValue }) => {
    try {
      const response = await api.post(USER_API.ADD_DEVICE, deviceData);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Thêm thiết bị thất bại'
      );
    }
  }
);

// Remove Device
export const removeDevice = createAsyncThunk(
  'user/removeDevice',
  async (deviceId, { rejectWithValue }) => {
    try {
      await api.delete(USER_API.REMOVE_DEVICE(deviceId));
      return { deviceId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Xóa thiết bị thất bại'
      );
    }
  }
);
