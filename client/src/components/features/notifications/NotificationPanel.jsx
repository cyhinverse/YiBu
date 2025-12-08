import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Loader2,
  Bell,
  Check,
  Clock,
  RefreshCw,
  Filter,
  FileText,
} from "lucide-react";
import { getNotifications, markAsRead as markAsReadAction, markAllAsRead as markAllAsReadAction } from "../../../redux/actions/notificationActions";
// Redundant manual imports removed
import { formatDistanceToNow } from "../../../utils/dateUtils";
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

  const fetchNotifications = useCallback(
    async () => {
    try {
      // dispatch(setLoading(true)); // Handled by getNotifications.pending
      // Replaced service call with action dispatch
      const response = await dispatch(getNotifications()).unwrap();

      // Assuming action payload structure
      if (response && response.notifications) {
        // setNotifications is handled by extraReducers usually, but if not:
        // dispatch(setNotifications(response.notifications)); // Handled by getNotifications.fulfilled
        setConnectionIssue(false);
        setLastUpdated(Date.now());
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Simplified error handling
      if (error?.code === "ERR_NETWORK") {
         setConnectionIssue(true);
      }
      // dispatch(setError(error?.message || "Không thể tải thông báo")); // Handled by getNotifications.rejected
    } finally {
      // dispatch(setLoading(false)); // Handled by getNotifications.fulfilled/rejected
    }
  }, [dispatch]);

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
  }, [dispatch,fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await dispatch(markAsReadAction(notificationId)).unwrap();
      // dispatch(markAsRead(notificationId)); // Redundant if extraReducer handles it
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsReadAction()).unwrap();
      // No need to dispatch slice action if thunk handles state update via extraReducers
      // or if we want local toggle, we should have a reducer for it.
      // Checking slice, it has extraReducers for markAllAsRead.fulfilled
      // So we don't need double dispatch.
      toast.success("Đã đánh dấu tất cả là đã đọc");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const formatTime = (date) => {
    return formatDistanceToNow(new Date(date));
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
    <div className="flex flex-col max-h-[600px] rounded-lg overflow-hidden shadow-lg border border-surface-highlight bg-surface">
      {/* Header */}
      <div className="bg-surface text-text-primary flex items-center justify-between p-4 border-b border-surface-highlight sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h3 className="text-lg font-medium">Thông báo</h3>
        </div>

        <div className="flex items-center space-x-2">
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}

          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary border border-surface-highlight rounded hover:bg-surface-highlight transition-colors"
            >
              <Filter size={12} />
              {filterLabels[filter]}
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-1 bg-surface rounded shadow-md border border-surface-highlight z-20 min-w-[120px]">
                <button
                  onClick={() => {
                    setFilter("all");
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-highlight transition-colors ${
                    filter === "all" ? "bg-primary/10 text-primary" : "text-text-primary"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => {
                    setFilter("unread");
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-highlight transition-colors ${
                    filter === "unread" ? "bg-primary/10 text-primary" : "text-text-primary"
                  }`}
                >
                  Chưa đọc
                </button>
                <button
                  onClick={() => {
                    setFilter("read");
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-highlight transition-colors ${
                    filter === "read" ? "bg-primary/10 text-primary" : "text-text-primary"
                  }`}
                >
                  Đã đọc
                </button>
              </div>
            )}
          </div>

          <button
            onClick={fetchNotifications}
            className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
            disabled={loading}
            title="Làm mới"
          >
            <RefreshCw size={14} />
          </button>

          <button
            onClick={handleMarkAllAsRead}
            className="text-xs text-primary hover:text-secondary transition-colors hover:underline"
            disabled={loading}
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>

      <div className="overflow-y-auto bg-surface divide-y divide-surface-highlight custom-scrollbar">
        {filteredNotifications.length === 0 ? (
          <div className="p-10 text-center text-text-secondary">
            <div className="mb-3">
              <Bell size={30} className="text-surface-highlight mx-auto" />
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
                className={`flex items-start p-4 hover:bg-surface-highlight transition-colors group relative ${
                  !notification.isRead ? "bg-primary/5" : ""
                }`}
              >
                {!notification.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                )}

                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-text-primary">
                      {notification.sender?.username ||
                        notification.sender?.name ||
                        "Người dùng"}
                    </p>
                    <p className="text-xs text-text-secondary flex items-center">
                      <Clock size={10} className="mr-1 opacity-70" />
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>

                  <p className="text-sm text-text-primary">
                    {notification.content || (
                      <span className="italic text-text-secondary">
                        Không có nội dung
                      </span>
                    )}
                  </p>

                  {notification.post && (
                    <div className="mt-2 p-2 bg-surface-highlight border border-surface-highlight rounded text-xs flex items-center">
                      <FileText
                        size={12}
                        className="text-primary mr-2 flex-shrink-0"
                      />
                      <p className="font-medium truncate flex-1 text-text-secondary">
                        {notification.post.caption ||
                          "Bài viết không có caption"}
                      </p>
                    </div>
                  )}
                </div>

                {!notification.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notification._id)}
                    className="absolute right-3 top-3 p-1.5 rounded-full text-primary hover:text-white hover:bg-primary transition-colors opacity-0 group-hover:opacity-100"
                    title="Đánh dấu đã đọc"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}

            <div className="p-2 text-center text-xs text-text-secondary flex items-center justify-center gap-1 border-t border-surface-highlight">
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
