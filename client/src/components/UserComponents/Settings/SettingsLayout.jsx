import React from "react";
import SideBarSettings from "./SideBarSettings";
import { Outlet } from "react-router-dom";

const SettingsLayout = () => {
  return (
    <div className="w-[95vw] h-[86vh] m-auto rounded-xl mt-5   ">
      <div className="h-[100%]  grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 h-full">
          <SideBarSettings />
        </div>
        <div className="md:col-span-3 shadow-lg rounded-xl p-5 bg-white overflow-hidden h-full flex flex-col border border-gray-200 dark:border-gray-700">
          <div className="overflow-y-auto hide-scroll flex-1 pr-2">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
