import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Loader2,
  Bell,
  Check,
  Trash2,
  MoreHorizontal,
  Clock,
  RefreshCw,
  Filter,
  FileText,
} from "lucide-react";
import NOTIFICATION from "../../../services/notificationService";
import {
  setNotifications,
  markAsRead,
  markAllAsRead,
  setLoading,
  setError,
} from "../../../slices/NotificationSlice";
import { formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "react-hot-toast";

const NotificationPanel = () => {
  const dispatch = useDispatch();
  const { notifications, loading, error } = useSelector(
    (state) => state.notification
  );
  const [connectionIssue, setConnectionIssue] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [filter, setFilter] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const fetchNotifications = async () => {
    try {
      dispatch(setLoading(true));
      const response = await NOTIFICATION.GET_NOTIFICATIONS();

      if (response.data?.code === 1) {
        dispatch(setNotifications(response.data.notifications));
        setConnectionIssue(false);
        setLastUpdated(Date.now());
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      if (error.code === "ERR_NETWORK" || error.response?.status === 404) {
        setConnectionIssue(true);
        toast.error("Không thể kết nối đến server thông báo");
      }
      dispatch(setError("Không thể tải thông báo"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchNotifications();

    const refreshInterval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    const handleRefreshEvent = () => {
      fetchNotifications();
    };

    document.addEventListener("refresh:notifications", handleRefreshEvent);

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener("refresh:notifications", handleRefreshEvent);
    };
  }, [dispatch]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await NOTIFICATION.MARK_AS_READ(notificationId);
      if (response.data?.code === 1) {
        dispatch(markAsRead(notificationId));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await NOTIFICATION.MARK_ALL_AS_READ();
      if (response.data?.code === 1) {
        dispatch(markAllAsRead());
        toast.success("Đã đánh dấu tất cả là đã đọc");
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const formatTime = (date) => {
    const formattedRelative = formatDistanceToNowStrict(new Date(date), {
      addSuffix: true,
      locale: vi,
    });
    return formattedRelative.includes("dưới 1 phút trước")
      ? "Vừa xong"
      : formattedRelative;
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.isRead;
    if (filter === "read") return notification.isRead;
    return true;
  });

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 h-40 bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (connectionIssue) {
    return (
      <div className="p-6 text-center bg-white">
        <div className="mb-4">
          <p className="font-medium text-red-500">
            Không thể kết nối đến server
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-500 text-white rounded-md text-sm hover:bg-indigo-600 transition-colors shadow-sm"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-white">
        <div className="mb-4">
          <p className="font-medium text-red-500">{error}</p>
        </div>
        <button
          onClick={fetchNotifications}
          className="px-4 py-2 bg-indigo-500 text-white rounded-md text-sm hover:bg-indigo-600 transition-colors shadow-sm"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const filterLabels = {
    all: "Tất cả",
    unread: "Chưa đọc",
    read: "Đã đọc",
  };

  return (
    <div className="flex flex-col max-h-[600px] rounded-lg overflow-hidden shadow-lg border border-gray-100">
      {/* Header */}
      <div className="bg-white text-gray-800 flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-indigo-500" />
          <h3 className="text-lg font-medium">Thông báo</h3>
        </div>

        <div className="flex items-center space-x-2">
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          )}

          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              <Filter size={12} />
              {filterLabels[filter]}
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-1 bg-white rounded shadow-md border border-gray-100 z-20 min-w-[120px]">
                <button
                  onClick={() => {
                    setFilter("all");
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                    filter === "all" ? "bg-indigo-50 text-indigo-600" : ""
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => {
                    setFilter("unread");
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                    filter === "unread" ? "bg-indigo-50 text-indigo-600" : ""
                  }`}
                >
                  Chưa đọc
                </button>
                <button
                  onClick={() => {
                    setFilter("read");
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                    filter === "read" ? "bg-indigo-50 text-indigo-600" : ""
                  }`}
                >
                  Đã đọc
                </button>
              </div>
            )}
          </div>

          <button
            onClick={fetchNotifications}
            className="p-1.5 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors"
            disabled={loading}
            title="Làm mới"
          >
            <RefreshCw size={14} />
          </button>

          <button
            onClick={handleMarkAllAsRead}
            className="text-xs text-indigo-500 hover:text-indigo-600 transition-colors hover:underline"
            disabled={loading}
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>

      <div className="overflow-y-auto bg-white divide-y divide-gray-100">
        {filteredNotifications.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <div className="mb-3">
              <Bell size={30} className="text-gray-300 mx-auto" />
            </div>
            <p>
              {filter === "all"
                ? "Không có thông báo nào"
                : filter === "unread"
                ? "Không có thông báo chưa đọc"
                : "Không có thông báo đã đọc"}
            </p>
          </div>
        ) : (
          <div>
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`flex items-start p-4 hover:bg-gray-50 transition-colors group relative ${
                  !notification.isRead ? "bg-indigo-50/30" : ""
                }`}
              >
                {!notification.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400"></div>
                )}

                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.sender?.username ||
                        notification.sender?.name ||
                        "Người dùng"}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Clock size={10} className="mr-1 text-gray-400" />
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>

                  <p className="text-sm text-gray-700">
                    {notification.content || (
                      <span className="italic text-gray-400">
                        Không có nội dung
                      </span>
                    )}
                  </p>

                  {notification.post && (
                    <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs flex items-center">
                      <FileText
                        size={12}
                        className="text-indigo-400 mr-2 flex-shrink-0"
                      />
                      <p className="font-medium truncate flex-1 text-gray-700">
                        {notification.post.caption ||
                          "Bài viết không có caption"}
                      </p>
                    </div>
                  )}
                </div>

                {!notification.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notification._id)}
                    className="absolute right-3 top-3 p-1.5 rounded-full text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Đánh dấu đã đọc"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}

            <div className="p-2 text-center text-xs text-gray-400 flex items-center justify-center gap-1 border-t border-gray-100">
              <Clock size={10} />
              Cập nhật: {formatTime(lastUpdated)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
