import { socket } from "../socket";
import { store } from "../utils/configureStore";
import { toast } from "react-hot-toast";
import { addNotification } from "../slices/NotificationSlice";

// Function để kiểm tra quyền thông báo
const checkNotificationPermission = async () => {
  // Chỉ kiểm tra nếu browser hỗ trợ Notifications API
  if (!("Notification" in window)) {
    console.warn("Trình duyệt này không hỗ trợ thông báo desktop");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Lỗi khi yêu cầu quyền thông báo:", error);
      return false;
    }
  }

  return false;
};

// Function để show thông báo cross-browser
const showNotification = (title, options = {}) => {
  // Hiển thị toast notification trong app
  toast(title, {
    icon: options.icon || "🔔",
    duration: 5000,
    ...options,
  });

  // Tạo thêm Desktop notification nếu được phép và trình duyệt hỗ trợ
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      // Tạo Desktop notification
      new Notification(title, {
        body: options.body || "",
        icon: options.imageUrl || "/notification-icon.png",
        tag: options.tag || "default",
      });
    } catch (error) {
      console.error("Lỗi khi hiển thị thông báo desktop:", error);
    }
  }
};

export const setupNotificationSystem = () => {
  if (!socket) {
    console.error("Socket không được khởi tạo");
    return false;
  }

  // Yêu cầu quyền thông báo ngay khi khởi tạo
  checkNotificationPermission().then((granted) => {
    console.log(
      `Quyền thông báo desktop: ${granted ? "Đã cấp" : "Không được cấp"}`
    );
  });

  // Lắng nghe sự kiện thông báo mới
  socket.on("notification:new", (notification) => {
    console.log("Nhận thông báo mới qua socket:", notification);

    if (!notification || !notification._id) {
      console.error("Thông báo không hợp lệ:", notification);
      return;
    }

    try {
      // Thêm thông báo vào store Redux
      store.dispatch(addNotification(notification));

      // Tạo thông báo tương ứng với loại
      let title = "Thông báo mới";
      let body = notification.content || "Bạn có thông báo mới";
      let icon = "🔔";

      switch (notification.type) {
        case "like":
          icon = "❤️";
          title = "Có người thích bài viết của bạn";
          break;
        case "comment":
          icon = "💬";
          title = "Có người bình luận bài viết của bạn";
          break;
        case "follow":
          icon = "👤";
          title = "Có người mới theo dõi bạn";
          break;
        case "save":
          icon = "📋";
          title = "Có người lưu bài viết của bạn";
          break;
        default:
          break;
      }

      // Hiển thị thông báo
      showNotification(title, {
        body,
        icon,
        tag: notification._id,
        data: notification,
      });
    } catch (error) {
      console.error("Lỗi khi xử lý thông báo:", error);
    }
  });

  // Đăng ký với server để nhận thông báo cá nhân
  const registerForNotifications = (userId) => {
    if (!userId || !socket.connected) return false;

    try {
      // Tham gia vào phòng thông báo cá nhân
      socket.emit("join_room", userId);
      console.log(`Đã đăng ký nhận thông báo cho user ${userId}`);
      return true;
    } catch (error) {
      console.error("Lỗi khi đăng ký nhận thông báo:", error);
      return false;
    }
  };

  return {
    registerForNotifications,
    showNotification,
  };
};

// Singleton instance
let notificationManager = null;

export const getNotificationManager = () => {
  if (!notificationManager) {
    notificationManager = setupNotificationSystem();
  }
  return notificationManager;
};
