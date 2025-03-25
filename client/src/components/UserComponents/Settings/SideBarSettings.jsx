import React from "react";
import { NavLink } from "react-router-dom";
import { Settings, User, Shield, Bell, Palette } from "lucide-react";

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
    <div className="h-full overflow-hidden rounded-xl shadow-lg p-5 border border-gray-200 dark:border-gray-700 flex flex-col">
      <h2 className="text-2xl font-bold mb-4  ">Settings</h2>
      <div className="overflow-y-auto hide-scroll flex-1">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg cursor-pointer
                  transition-all duration-300 ease-in-out
                  ${isActive ? " dark:opacity-55 " : "hover:opacity-55 "}`
                }
              >
                <span
                  className={`mr-3 transition-colors duration-300 ${
                    window.location.pathname === item.path
                      ? "text-purple-700 dark:text-purple-300"
                      : "text-purple-600 dark:text-purple-400"
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
    </div>
  );
};

export default SideBarSettings;
