import React from "react";
import { NavLink } from "react-router-dom";
import {
  Settings,
  User,
  Shield,
  Bell,
  Globe,
  Palette,
  HelpCircle,
  Lock,
} from "lucide-react";

const menuItems = [
  {
    title: "Cài Đặt Tài Khoản",
    icon: <User size={20} />,
    path: "/settings/account",
  },
  {
    title: "Cài Đặt Hồ Sơ",
    icon: <Settings size={20} />,
    path: "/settings/profile",
  },
  {
    title: "Cài Đặt Quyền Riêng Tư",
    icon: <Shield size={20} />,
    path: "/settings/privacy",
  },
  {
    title: "Cài Đặt Thông Báo",
    icon: <Bell size={20} />,
    path: "/settings/notification",
  },

  {
    title: "Ngôn Ngữ & Giao Diện",
    icon: <Palette size={20} />,
    path: "/settings/theme",
  },
];

const SideBarSettings = () => {
  return (
    <div className="w-[300px] h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-purple-700 dark:text-purple-400">
        Settings
      </h2>
      <ul className="space-y-2">
        {menuItems.map((item, index) => (
          <li key={index}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg cursor-pointer 
                transition-all duration-300 ease-in-out
                ${
                  isActive
                    ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                    : "hover:bg-purple-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                }`
              }
            >
              <span
                className={`mr-3 transition-colors duration-300 ${
                  window.location.pathname === item.path
                    ? "text-purple-700 dark:text-purple-400"
                    : "text-purple-600 dark:text-purple-500"
                }`}
              >
                {item.icon}
              </span>
              <span className="text-base">{item.title}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SideBarSettings;
