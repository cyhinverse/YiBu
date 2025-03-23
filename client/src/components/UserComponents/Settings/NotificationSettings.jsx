import React, { useState, useEffect } from "react";
import NotificationTest from "../Notification/NotificationTest";
import UserSettingsService from "../../../services/userSettingsService";
import { toast } from "react-toastify";

const NotificationSettings = () => {
  const [loading, setLoading] = useState(false);
  const [notificationData, setNotificationData] = useState({
    pushEnabled: true,
    emailEnabled: true,
    activityNotifications: {
      likes: true,
      comments: true,
      followers: true,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await UserSettingsService.getAllSettings();
      if (
        response.success &&
        response.userSettings &&
        response.userSettings.notification
      ) {
        setNotificationData(response.userSettings.notification);
      }
    } catch (error) {
      console.error("Lỗi khi lấy cài đặt thông báo:", error);
      toast.error("Không thể tải cài đặt thông báo");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e, section, subSection = null) => {
    const isChecked = e.target.checked;

    if (subSection) {
      setNotificationData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [subSection]: isChecked,
        },
      }));
    } else {
      setNotificationData((prev) => ({
        ...prev,
        [section]: isChecked,
      }));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await UserSettingsService.updateNotificationSettings(notificationData);
      toast.success("Cài đặt thông báo đã được lưu");
    } catch (error) {
      console.error("Lỗi khi cập nhật thông báo:", error);
      toast.error("Lỗi khi lưu cài đặt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Cài đặt thông báo</h2>
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Thông báo đẩy</h3>
          <div className="flex items-center justify-between">
            <p>Thông báo đẩy</p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={notificationData.pushEnabled}
                onChange={(e) => handleChange(e, "pushEnabled")}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Thông báo email</h3>
          <div className="flex items-center justify-between">
            <p>Gửi thông báo qua email</p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={notificationData.emailEnabled}
                onChange={(e) => handleChange(e, "emailEnabled")}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Thông báo hoạt động</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p>Lượt thích bài viết</p>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationData.activityNotifications.likes}
                  onChange={(e) =>
                    handleChange(e, "activityNotifications", "likes")
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <p>Bình luận bài viết</p>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationData.activityNotifications.comments}
                  onChange={(e) =>
                    handleChange(e, "activityNotifications", "comments")
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <p>Người theo dõi mới</p>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationData.activityNotifications.followers}
                  onChange={(e) =>
                    handleChange(e, "activityNotifications", "followers")
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Thêm component test thông báo */}
      <NotificationTest />
    </div>
  );
};

export default NotificationSettings;
