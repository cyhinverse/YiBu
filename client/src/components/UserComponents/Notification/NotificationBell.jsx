import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useSelector } from "react-redux";
import NotificationPanel from "./NotificationPanel";
import { getNotificationManager } from "../../../socket/notificationManager";
import { toast } from "react-hot-toast";

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, notifications } = useSelector(
    (state) => state.notification
  );
  const currentUser = useSelector((state) => state.auth?.user);

  // Đăng ký thông báo khi component được mount và người dùng đã đăng nhập
  useEffect(() => {
    if (!currentUser?.user?._id) return;

    // Khởi tạo notification manager
    const notificationManager = getNotificationManager();
    if (!notificationManager) {
      console.warn(
        "[NotificationBell] Failed to initialize notification manager"
      );
      return;
    }

    // Đăng ký nhận thông báo
    notificationManager.registerForNotifications(currentUser.user._id);
    console.log("[NotificationBell] Registered for notifications");

    // Yêu cầu quyền thông báo trên trình duyệt nếu cần
    if (
      "Notification" in window &&
      Notification.permission !== "granted" &&
      Notification.permission !== "denied"
    ) {
      try {
        // Hiển thị thông báo yêu cầu người dùng cấp quyền
        toast(
          (t) => (
            <div className="flex items-center gap-2">
              <span>Bật thông báo để không bỏ lỡ tin mới</span>
              <button
                onClick={() => {
                  Notification.requestPermission().then((perm) => {
                    if (perm === "granted") {
                      toast.success("Đã bật thông báo!");
                    }
                  });
                  toast.dismiss(t.id);
                }}
                className="px-2 py-1 bg-indigo-500 text-white rounded-md text-xs"
              >
                Bật
              </button>
            </div>
          ),
          { duration: 5000 }
        );
      } catch (error) {
        console.error(
          "[NotificationBell] Error requesting notification permission:",
          error
        );
      }
    }
  }, [currentUser?.user?._id]);

  // Ghi log khi có thông báo mới hoặc số lượng thay đổi (để debug)
  useEffect(() => {
    console.log("[NotificationBell] Unread count:", unreadCount);
    console.log(
      "[NotificationBell] Total notifications:",
      notifications?.length || 0
    );
  }, [unreadCount, notifications]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        aria-label="Thông báo"
        title="Thông báo"
      >
        <Bell
          size={20}
          className={unreadCount > 0 ? "text-indigo-500" : "text-gray-500"}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 z-40 w-96 rounded-lg shadow-lg overflow-hidden">
            <NotificationPanel onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
