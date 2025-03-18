import React from "react";
import SideBarProfile from "./SideBarProfile";
import { Outlet } from "react-router-dom";

const ProfileLayout = () => {
  return (
    <div className="w-[95vw] h-[86vh] bg-purple-50 m-auto rounded-xl mt-5 shadow-md flex gap-4 justify-between">
      <SideBarProfile />
      <Outlet />
    </div>
  );
};

export default ProfileLayout;
