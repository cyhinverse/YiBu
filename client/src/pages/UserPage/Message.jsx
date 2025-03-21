import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MainMessage } from "../../components/UserComponents";

const Message = () => {
  const location = useLocation();
  const isDetailView = location.pathname.includes("/messages/");

  return (
    <div className="h-full flex-1 overflow-hidden">
      <div className="max-w-6xl mx-auto h-full">
        <div className="h-full bg-white rounded-lg shadow-md flex overflow-hidden border border-gray-100">
          {/* Left sidebar - always visible on larger screens */}
          <div
            className={`${
              isDetailView ? "hidden md:block" : "w-full"
            } md:w-1/3 border-r border-gray-200 bg-white`}
          >
            <MainMessage />
          </div>

          {/* Right message area */}
          <div
            className={`${
              isDetailView ? "w-full" : "hidden md:block"
            } md:w-2/3 bg-white flex flex-col`}
          >
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
