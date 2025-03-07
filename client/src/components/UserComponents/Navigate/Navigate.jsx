import React, { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Bell,
  Home,
  MessageCircle,
  MonitorPlay,
  Moon,
  Search,
  Sun,
  Settings,
} from "lucide-react";
import { DataContext } from "../../../DataProvider";

const Navigate = () => {
  const { hideSearch, setHideSearch } = useContext(DataContext);
  const [sunMoon, setSunMoon] = useState(true);

  const navItems = [
    { icon: Home, path: "/" },
    { icon: MessageCircle, path: "/messages" },
    { icon: MonitorPlay, path: "/videos" },
  ];

  return (
    <>
      {/* Search Box */}
      <div className="flex w-[250px] h-[50px] items-center px-4 shadow-xl rounded-xl bg-purple-100">
        {hideSearch && <Search />}
        <input
          onClick={() => setHideSearch(!hideSearch)}
          className="indent-2 h-full flex-1 outline-none cursor-pointer bg-transparent"
          type="text"
          placeholder="Search event..."
        />
      </div>

      {/* Navigation Icons */}
      <div className="flex w-[250px] h-[50px] justify-between items-center px-6 shadow-xl rounded-xl bg-purple-100">
        {navItems.map((item, i) => (
          <NavLink
            key={i}
            to={item.path}
            className={({ isActive }) =>
              `w-[40px] h-[40px] flex items-center justify-center rounded-lg hover:opacity-50 transition-all ease-out cursor-pointer ${
                isActive ? "text-red-300" : ""
              }`
            }
          >
            <item.icon />
          </NavLink>
        ))}

        {/* Avatar ở ngoài cùng bên phải */}
        <NavLink
          to="/profile"
          className="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:opacity-50 transition-all ease-out cursor-pointer"
        >
          <img
            src="https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Profile"
            className="w-[40px] h-[40px] rounded-full object-cover"
          />
        </NavLink>
      </div>

      {/* Bell & Avatar */}
      <div className="flex w-[200px] h-[50px] justify-center items-center gap-4 px-6 shadow-xl rounded-xl bg-purple-100">
        <div
          onClick={() => setSunMoon(!sunMoon)}
          className="cursor-pointer w-[40px] h-[40px] items-center justify-center flex"
        >
          {sunMoon ? <Sun /> : <Moon />}
        </div>
        <div className="w-[40px] h-[40px] items-center justify-center flex">
          <Bell className="cursor-pointer" />
        </div>
        <NavLink
          to="/settings"
          className="w-[40px] h-[40px] items-center justify-center flex"
        >
          <Settings className="cursor-pointer" />
        </NavLink>
      </div>
    </>
  );
};

export default Navigate;
