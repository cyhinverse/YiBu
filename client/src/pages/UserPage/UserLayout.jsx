import React from "react";
import { Outlet } from "react-router-dom";
import { Navigate } from "../../components/UserComponents";
import { useSelector } from "react-redux";

const UserLayout = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
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
