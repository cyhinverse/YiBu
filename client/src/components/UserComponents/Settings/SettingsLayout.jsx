import React from "react";
import SideBarSettings from "./SideBarSettings";
import { Outlet } from "react-router-dom";

const SettingsLayout = () => {
  return (
    <div className="w-[95vw] h-[86vh] bg-purple-50 mt-5 shadow-2xl rounded-xl m-auto flex gap-2 overflow-hidden">
      {/* Sidebar cố định */}
      <SideBarSettings />

      {/* Content chiếm phần còn lại + scroll */}
      <div className="flex-1 h-full overflow-y-auto p-4">
        <Outlet />
      </div>
    </div>
  );
};

export default SettingsLayout;
