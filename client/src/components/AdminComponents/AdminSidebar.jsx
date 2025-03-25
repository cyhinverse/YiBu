import React, { useState } from "react";
import {
  FaTachometerAlt,
  FaUsers,
  FaCog,
  FaChartBar,
  FaChartPie,
  FaComments,
  FaExclamationTriangle,
  FaBan,
  FaMoneyBillWave,
  FaLock,
  FaHistory,
} from "react-icons/fa";

const AdminSidebar = ({ activePage, setActivePage }) => {
  const menuItems = [
    { id: "dashboard", icon: <FaTachometerAlt />, label: "Dashboard" },
    { id: "users", icon: <FaUsers />, label: "Quản Lý Người Dùng" },
    { id: "posts", icon: <FaChartBar />, label: "Quản Lý Bài Viết" },
    { id: "comments", icon: <FaComments />, label: "Quản Lý Bình Luận" },
    {
      id: "reports",
      icon: <FaExclamationTriangle />,
      label: "Báo Cáo & Khiếu Nại",
    },
    { id: "interactions", icon: <FaChartPie />, label: "Quản Lý Tương Tác" },
    { id: "banned", icon: <FaBan />, label: "Tài Khoản Bị Khóa" },
    { id: "revenue", icon: <FaMoneyBillWave />, label: "Doanh Thu" },
    { id: "settings", icon: <FaCog />, label: "Cài Đặt" },
    { id: "adminlogs", icon: <FaHistory />, label: "Log & Hoạt Động" },
  ];

  return (
    <aside className="bg-gray-800 text-white w-full md:w-64 p-4 overflow-y-auto h-screen sticky top-0">
      <div className="mb-6 flex items-center justify-center">
        <h1 className="text-xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
          Admin Portal
        </h1>
      </div>
      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li
              key={item.id}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                activePage === item.id
                  ? "bg-indigo-700 shadow-md"
                  : "hover:bg-gray-700"
              }`}
              onClick={() => setActivePage(item.id)}
            >
              <span
                className={`mr-3 text-lg ${
                  activePage === item.id ? "text-white" : "text-gray-300"
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`${activePage === item.id ? "font-medium" : ""}`}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
