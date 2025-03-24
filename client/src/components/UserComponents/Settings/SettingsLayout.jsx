import React from "react";
import SideBarSettings from "./SideBarSettings";
import { Outlet } from "react-router-dom";

const SettingsLayout = () => {
  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <SideBarSettings />
          </div>
          <div className="md:col-span-3 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
