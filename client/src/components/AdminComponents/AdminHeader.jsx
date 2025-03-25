import React from "react";
import { Bell, Settings, User, Search } from "lucide-react";

const pageTitles = {
  dashboard: "Dashboard Tổng Quan",
  users: "Quản Lý Người Dùng",
  posts: "Quản Lý Bài Viết",
  comments: "Quản Lý Bình Luận",
  reports: "Báo Cáo & Khiếu Nại",
  interactions: "Quản Lý Tương Tác",
  banned: "Tài Khoản Bị Khóa",
  revenue: "Doanh Thu",
  settings: "Cài Đặt Hệ Thống",
  adminlogs: "Log & Hoạt Động Admin",
};

const AdminHeader = ({ activePage }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            {pageTitles[activePage] || "Admin Dashboard"}
          </h1>
          <p className="text-sm text-gray-500">
            Xem và quản lý dữ liệu trong hệ thống
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-64 pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search
              className="absolute right-3 top-2.5 text-gray-400"
              size={18}
            />
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100 relative">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Settings size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <User size={18} />
            </div>
            <span className="text-sm font-medium text-gray-700 hidden md:inline">
              Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
