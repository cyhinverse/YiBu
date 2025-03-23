import axios from "../axios/axiosConfig";

const SAVE_POST = {
  SAVE_POST: async (postId) => {
    try {
      return await axios.post(`/api/savepost/${postId}`);
    } catch (error) {
      console.error("Error in SAVE_POST:", error);
      throw error;
    }
  },

  UNSAVE_POST: async (postId) => {
    try {
      return await axios.delete(`/api/savepost/${postId}`);
    } catch (error) {
      console.error("Error in UNSAVE_POST:", error);
      throw error;
    }
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

        const response = await axios.get(
          `/api/savepost?page=${page}&limit=${limit}`
        );

        // Kiểm tra phản hồi
        if (!response || !response.data) {
          throw new Error("Invalid response from server");
        }

        console.log(`GET_SAVED_POSTS response:`, response.data);

        // Kiểm tra và log cấu trúc dữ liệu
        if (response.data && response.data.savedPosts) {
          const count = Array.isArray(response.data.savedPosts)
            ? response.data.savedPosts.length
            : 0;

          console.log(`Fetched ${count} saved posts`);

          if (count > 0) {
            const firstPost = response.data.savedPosts[0];
            console.log(`First post structure:`, Object.keys(firstPost));

            // Xử lý restructure dữ liệu nếu cần
            if (firstPost && firstPost.post && !firstPost._id) {
              console.log(
                `Restructuring data format - unwrapping post objects`
              );
              response.data.savedPosts = response.data.savedPosts
                .filter((item) => item && item.post)
                .map((item) => {
                  return {
                    ...item.post,
                    savedId: item._id,
                  };
                });
              console.log(
                `After restructuring:`,
                response.data.savedPosts.length
              );
            }
          }
        } else if (response.data && !response.data.savedPosts) {
          // Nếu không có trường savedPosts, tạo mảng rỗng
          response.data.savedPosts = [];
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
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempt + 1))
          );
        }
      }
    }

    // Nếu tất cả các lần retry đều thất bại
    return Promise.reject(lastError);
  },

  CHECK_SAVED_STATUS: async (postId) => {
    try {
      return await axios.get(`/api/savepost/check/${postId}`);
    } catch (error) {
      console.error("Error in CHECK_SAVED_STATUS:", error);
      throw error;
    }
  },
};

export default SAVE_POST;
