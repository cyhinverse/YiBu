import React, { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Bell,
  Home,
  MessageCircle,
  Moon,
  Search,
  Sun,
  Settings,
  Music,
} from "lucide-react";
import { DataContext } from "../../../DataProvider";
import { useSelector } from "react-redux";

const Navigate = () => {
  const { hideSearch, setHideSearch } = useContext(DataContext);
  const [sunMoon, setSunMoon] = useState(true);

  const navItems = [
    { icon: Home, path: "/" },
    { icon: MessageCircle, path: "/messages" },
    { icon: Music, path: "/musics" },
  ];
  const id = useSelector((s) => s.auth.user.user._id);

  return (
    <>
      <div className="hidden md:flex w-[250px] h-[50px] items-center px-4 shadow-md rounded-xl bg-purple-100 border border-gray-300">
        {hideSearch && <Search />}
        <input
          onClick={() => setHideSearch(!hideSearch)}
          className="indent-2 h-full flex-1 outline-none cursor-pointer bg-transparent"
          type="text"
          placeholder="Search event..."
        />
      </div>

      <div className="flex w-[200px] md:w-[250px] h-[50px] justify-between items-center px-3 md:px-6 shadow-md border border-gray-300 rounded-xl bg-purple-100">
        {navItems.map((item, i) => (
          <NavLink
            key={i}
            to={item.path}
            className={({ isActive }) =>
              `w-[35px] md:w-[40px] h-[35px] md:h-[40px] flex items-center justify-center rounded-lg hover:opacity-50 transition-all ease-out cursor-pointer ${
                isActive ? "text-red-300" : ""
              }`
            }
          >
            <item.icon size={20} />
          </NavLink>
        ))}

        {/* Avatar */}
        <NavLink
          to={`/profile/${id}`}
          className="w-[35px] md:w-[40px] h-[35px] md:h-[40px] flex items-center justify-center rounded-full hover:opacity-50 transition-all ease-out cursor-pointer"
        >
          <img
            src="https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Profile"
            className="w-[35px] md:w-[40px] h-[35px] md:h-[40px] rounded-full object-cover"
          />
        </NavLink>
      </div>

      <div className="flex w-[150px] md:w-[200px] h-[50px] justify-center items-center gap-2 md:gap-4 px-3 md:px-6 shadow-md border border-gray-300 rounded-xl bg-purple-100">
        <div
          onClick={() => setSunMoon(!sunMoon)}
          className="cursor-pointer w-[35px] md:w-[40px] h-[35px] md:h-[40px] items-center justify-center flex"
        >
          {sunMoon ? <Sun size={20} /> : <Moon size={20} />}
        </div>
        <div className="w-[35px] md:w-[40px] h-[35px] md:h-[40px] items-center justify-center flex">
          <Bell className="cursor-pointer" size={20} />
        </div>
        <NavLink
          to="/settings"
          className="w-[35px] md:w-[40px] h-[35px] md:h-[40px] items-center justify-center flex"
        >
          <Settings className="cursor-pointer" size={20} />
        </NavLink>
      </div>
    </>
  );
};

export default Navigate;
