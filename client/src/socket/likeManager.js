import { socket } from "../socket";
import { store } from "../utils/configureStore";
import { setPostLikeStatus } from "../slices/LikeSlice";

export const setupLikeSocket = () => {
  if (!socket) {
    console.error("Socket not initialized");
    return false;
  }

  socket.on("post:like:update", (data) => {
    const { postId, count, action, userId } = data;

    // console.log(`[Socket] Received like update for post ${postId}:`, data);

    const currentState = store.getState();
    const currentUser = currentState.auth?.user?.user?._id;
    const currentLikeState = currentState.like?.likesByPost?.[postId];

    if (userId === currentUser) {
      console.log(`[Socket] Ignoring like update from current user: ${userId}`);
      return;
    }

    if (count === undefined || count === null) {
      console.warn(`[Socket] Missing count in like update:`, data);
      return;
    }

    // console.log(
    //   `[Socket] Updating like state for post ${postId}. Current state:`,
    //   currentLikeState
    // );
    // console.log(`[Socket] New count: ${count}, User action: ${action}`);

    // Cập nhật store với số lượng like mới từ server
    // Giữ nguyên trạng thái isLiked của user hiện tại
    store.dispatch(
      setPostLikeStatus({
        postId,
        isLiked: currentLikeState?.isLiked || false,
        count: count,
      })
    );

    // console.log(`[Socket] State updated for post ${postId}`);
  });

  // Thêm lắng nghe cho sự kiện toàn cục - phòng hợp socket room không hoạt động đúng
  socket.on("post:*:like:update", (data) => {
    const eventName = socket.io._opts.event || "";
    const postIdMatch = eventName.match(/^post:(.+):like:update$/);

    if (!postIdMatch || !postIdMatch[1]) {
      console.warn(`[Socket] Cannot extract postId from event: ${eventName}`);
      return;
    }

    const postId = postIdMatch[1];
    // console.log(
    //   `[Socket] Received global like update for post ${postId}:`,
    //   data
    // );

    // Lấy state hiện tại
    const currentState = store.getState();
    const currentUser = currentState.auth?.user?.user?._id;
    const currentLikeState = currentState.like?.likesByPost?.[postId];

    // Bỏ qua nếu là hành động của chính người dùng
    if (data.userId === currentUser) {
      return;
    }

    // Cập nhật store
    store.dispatch(
      setPostLikeStatus({
        postId,
        isLiked: currentLikeState?.isLiked || false,
        count: data.count,
      })
    );
  });

  // Đăng ký tham gia phòng like cho một post
  const joinPostRoom = (postId) => {
    if (!postId || !socket.connected) return false;

    try {
      // console.log(`[Socket] Joining post room: post:${postId}`);

      // Tham gia phòng bằng join_room thông thường
      socket.emit("join_room", `post:${postId}`);

      // Đăng ký theo dõi sự kiện like cụ thể
      socket.emit("post:like:listen", postId);

      // Thêm lắng nghe sự kiện cụ thể cho post này
      socket.on(`post:${postId}:like:update`, (data) => {
        // console.log(
        //   `[Socket] Received direct like update for post ${postId}:`,
        //   data
        // );

        // Lấy state hiện tại
        const currentState = store.getState();
        const currentUser = currentState.auth?.user?.user?._id;
        const currentLikeState = currentState.like?.likesByPost?.[postId];

        // Bỏ qua nếu là hành động của chính người dùng
        if (data.userId === currentUser) {
          return;
        }

        // Cập nhật store
        store.dispatch(
          setPostLikeStatus({
            postId,
            isLiked: currentLikeState?.isLiked || false,
            count: data.count,
          })
        );
      });

      return true;
    } catch (error) {
      console.error(`[Socket] Error joining post room:`, error);
      return false;
    }
  };

  // Gửi hành động like/unlike
  const emitLikeAction = (postId, userId, action) => {
    if (!postId || !userId || !socket.connected) {
      console.warn(
        `[Socket] Cannot emit like action - Invalid params or not connected:`,
        {
          postId,
          userId,
          connected: socket?.connected,
        }
      );
      return false;
    }

    try {
      // console.log(`[Socket] Emitting ${action} action for post ${postId}`);
      socket.emit("post:like", {
        postId,
        userId,
        action, // 'like' hoặc 'unlike'
      });
      return true;
    } catch (error) {
      console.error(`[Socket] Error emitting like action:`, error);
      return false;
    }
  };

  return {
    joinPostRoom,
    emitLikeAction,
  };
};

// Singleton instance
let likeManager = null;

export const getLikeManager = () => {
  if (!likeManager) {
    likeManager = setupLikeSocket();
  }
  return likeManager;
};
