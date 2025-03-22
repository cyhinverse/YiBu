import React, { useState } from "react";
import { useSelector } from "react-redux";
// import { useSocketContext } from "../../../contexts/SocketContext";
import { Bell, Send } from "lucide-react";
import NOTIFICATION from "../../../services/notificationService";
import { toast } from "react-hot-toast";

const NotificationTest = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.user?._id;
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleTestNotification = async () => {
    try {
      if (!message.trim()) {
        toast.error("Vui lòng nhập nội dung thông báo");
        return;
      }

      setSending(true);
      const response = await NOTIFICATION.CREATE_NOTIFICATION({
        recipient: userId,
        type: "test",
        content: message,
      });

      if (response.data.code === 1) {
        toast.success("Đã gửi thông báo test");
        setMessage("");
      }
    } catch (error) {
      console.error("Lỗi khi gửi thông báo test:", error);
      toast.error("Lỗi khi gửi thông báo");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-6 p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={18} className="text-indigo-500" />
        <h3 className="text-lg font-medium text-gray-800">Test Thông Báo</h3>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập nội dung thông báo..."
            className="flex-1 p-2.5 bg-white border border-gray-300 rounded-l-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
            disabled={sending}
          />
          <button
            onClick={handleTestNotification}
            disabled={sending}
            className="px-4 py-2.5 bg-indigo-500 text-white rounded-r-lg hover:bg-indigo-600 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send size={14} />
            )}
            <span className="font-medium">Gửi</span>
          </button>
        </div>

        <div className="flex items-start gap-2 bg-indigo-50 p-3 rounded-md border border-indigo-100">
          <div className="bg-indigo-100 p-1 rounded-full">
            <Bell size={14} className="text-indigo-500" />
          </div>
          <p className="text-sm text-gray-600">
            Thông báo sẽ được gửi đến chính bạn để kiểm tra tính năng. Thông báo
            xuất hiện ngay sau khi gửi.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationTest;
