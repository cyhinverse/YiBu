import React from "react";
import { Outlet } from "react-router-dom";
import { Navigate } from "../../components/UserComponents";

const UserLayout = () => {
  return (
    <div>
      <div className="h-[60px] max-w-full flex justify-between items-center px-10">
        <Navigate />
      </div>
      <Outlet />
    </div>
  );
};

export default UserLayout;
