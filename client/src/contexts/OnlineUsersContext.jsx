import React, { createContext, useContext, useState, useEffect } from "react";
import { useSelector } from "react-redux";

// Tạo context
const OnlineUsersContext = createContext();

// Provider component
export const OnlineUsersProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState({});
  const { user } = useSelector((state) => state.auth);
  const currentUserId = user?.user?._id;

  useEffect(() => {
    // Khi component mount, đăng ký lắng nghe sự kiện user_online_status
    const handleUserStatusUpdate = (event) => {
      const { userId, status } = event.detail;

      console.log(`User ${userId} is now ${status}`);

      setOnlineUsers((prev) => ({
        ...prev,
        [userId]: status === "online",
      }));
    };

    window.addEventListener("user_online_status", handleUserStatusUpdate);

    // Tự đánh dấu người dùng hiện tại là online
    if (currentUserId) {
      setOnlineUsers((prev) => ({
        ...prev,
        [currentUserId]: true,
      }));
    }

    return () => {
      window.removeEventListener("user_online_status", handleUserStatusUpdate);
    };
  }, [currentUserId]);

  // Đăng ký người dùng hiện tại với socket khi component mount
  useEffect(() => {
    if (currentUserId) {
      // Import động để tránh circular dependency
      import("../socket").then(({ socket }) => {
        if (socket && socket.connected) {
          console.log("Registering current user with socket:", currentUserId);
          socket.emit("register_user", { userId: currentUserId });
        }
      });
    }
  }, [currentUserId]);

  // Hàm helper để kiểm tra nếu một người dùng đang online
  const isUserOnline = (userId) => {
    return !!onlineUsers[userId];
  };

  return (
    <OnlineUsersContext.Provider value={{ onlineUsers, isUserOnline }}>
      {children}
    </OnlineUsersContext.Provider>
  );
};

// Hook để sử dụng context
export const useOnlineUsers = () => {
  const context = useContext(OnlineUsersContext);
  if (!context) {
    throw new Error(
      "useOnlineUsers must be used within an OnlineUsersProvider"
    );
  }
  return context;
};

export default OnlineUsersProvider;
