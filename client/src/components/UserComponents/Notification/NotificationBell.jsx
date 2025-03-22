import React, { useState } from "react";
import { Bell } from "lucide-react";
import { useSelector } from "react-redux";
import NotificationPanel from "./NotificationPanel";

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useSelector((state) => state.notification);

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
