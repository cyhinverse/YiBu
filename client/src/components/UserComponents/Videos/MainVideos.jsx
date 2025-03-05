import React from "react";
import SideBarVideos from "./SidebarVideos";
import { Outlet } from "react-router-dom";

const MainVideos = () => {
  return (
    <>
      <div className="w-[95vw] h-[86vh] bg-purple-50 m-auto rounded-xl mt-5 shadow-md  flex gap-2 justify-between">
        <SideBarVideos />
        <Outlet />
      </div>
    </>
  );
};

export default MainVideos;
