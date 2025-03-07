import React from "react";
import SideBarProfile from "./SideBarProfile";
import { Outlet } from "react-router-dom";

const ProfileLayout = () => {
  return (
    <div className="w-[95vw] h-[86vh] bg-purple-50 m-auto rounded-xl mt-5 shadow-2xl flex gap-4">
      <SideBarProfile />
      <Outlet />
    </div>
  );
};

export default ProfileLayout;
