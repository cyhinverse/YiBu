import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navigate from "../../components/layout/Navigate/Navigate";
import { useSelector } from "react-redux";
import { useSocketContext } from "../../contexts/SocketContext";

const UserLayout = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const socketContext = useSocketContext();

  useEffect(() => {
    if (isAuthenticated && user?.user?._id && socketContext?.joinRoom) {
      console.log("Joining user room:", user.user._id);
      socketContext.joinRoom(user.user._id);
    }
  }, [isAuthenticated, user, socketContext]);

  if (isAuthenticated === undefined) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  return (
    <div>
      {/* Ẩn thanh `Navigate` nếu user là admin */}
      {user?.role !== "admin" && (
        <div className="h-[60px] max-w-full flex justify-between items-center px-10">
          <Navigate />
        </div>
      )}
      <Outlet />
    </div>
  );
};

export default UserLayout;
