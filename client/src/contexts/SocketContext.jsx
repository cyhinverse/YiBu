import React, { createContext, useContext } from "react";
import { useSelector } from "react-redux";
import useSocket from "../hooks/useSocket";

// Tạo context để chia sẻ kết nối socket
const SocketContext = createContext(null);

// Hook để sử dụng socket context
export const useSocketContext = () => useContext(SocketContext);

// Provider component
export const SocketProvider = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.user?._id;

  // Khởi tạo socket chỉ khi người dùng đã đăng nhập
  const socketData = useSocket(userId);

  return (
    <SocketContext.Provider value={socketData}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
