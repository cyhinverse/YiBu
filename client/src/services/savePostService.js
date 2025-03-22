import axios from "../axios/axiosConfig";

const SAVE_POST = {
  SAVE_POST: (postId) => {
    return axios.post(`/api/savepost/${postId}`);
  },

  UNSAVE_POST: (postId) => {
    return axios.delete(`/api/savepost/${postId}`);
  },

  GET_SAVED_POSTS: async (page = 1, limit = 50) => {
    console.log(`Fetching saved posts with page=${page}, limit=${limit}`);
    
    // Tăng giới hạn để đảm bảo tải đủ dữ liệu
    const MAX_RETRIES = 2;
    let lastError = null;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt} for GET_SAVED_POSTS`);
        }
        
        const response = await axios.get(`/api/savepost?page=${page}&limit=${limit}`);
        console.log(`GET_SAVED_POSTS response:`, response.data);
        
        // Kiểm tra và log cấu trúc dữ liệu
        if (response.data && response.data.savedPosts) {
          const count = response.data.savedPosts.length;
          console.log(`Fetched ${count} saved posts`);
          
          if (count > 0) {
            const firstPost = response.data.savedPosts[0];
            console.log(`First post structure:`, Object.keys(firstPost));
            if (firstPost.post) {
              console.log(`This appears to be a SavePost object with nested post data`);
              
              // Xử lý restructure dữ liệu nếu cần
              if (!firstPost._id && firstPost.post && firstPost.post._id) {
                console.log(`Restructuring data format - unwrapping post objects`);
                response.data.savedPosts = response.data.savedPosts.map(item => {
                  return item.post ? {...item.post, savedId: item._id} : item;
                });
                console.log(`After restructuring:`, response.data.savedPosts.length);
              }
            }
          }
        }
        
        return response;
      } catch (error) {
        console.error(`Error in GET_SAVED_POSTS (attempt ${attempt}):`, error);
        lastError = error;
        
        // Chỉ retry nếu là lỗi mạng, không phải lỗi server
        if (error.response) {
          // Lỗi server trả về, không retry
          return Promise.reject(error);
        }
        
        // Đợi trước khi retry
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    // Nếu tất cả các lần retry đều thất bại
    return Promise.reject(lastError);
  },

  CHECK_SAVED_STATUS: (postId) => {
    return axios.get(`/api/savepost/check/${postId}`);
  },
};

export default SAVE_POST;
