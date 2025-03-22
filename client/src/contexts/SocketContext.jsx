import React, { createContext, useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import useSocket from "../hooks/useSocket";

// Tạo context để chia sẻ kết nối socket
const SocketContext = createContext(null);

// Hook để sử dụng socket context
export const useSocketContext = () => useContext(SocketContext);

// Provider component
export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const userId = user?.user?._id;

  // Khởi tạo socket chỉ khi người dùng đã đăng nhập
  const socketConnection = useSocket(userId);

  // Các giá trị cần chia sẻ trong context
  const value = {
    ...socketConnection,
    userId,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
