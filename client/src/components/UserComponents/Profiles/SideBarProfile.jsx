import React from "react";
import { NavLink } from "react-router-dom";

const SideBarProfile = () => {
  const profileOptions = [
    { id: 1, name: "Trang chủ", link: "/profile/home" },
    { id: 2, name: "Quan tâm", link: "/profile/following" },
    { id: 3, name: "Bạn bè", link: "/profile/friends" },
    { id: 4, name: "Save posts", link: "/profile/save-posts" },
  ];
  return (
    <div className="w-[350px] h-full outline-2 outline-purple-400 rounded-xl p-4">
      <h1 className="text-purple-400 font-bold text-2xl mb-6">Profile Person</h1>
      <div className="flex flex-col gap-4">
        {profileOptions.map((item) => (
          <NavLink
            key={item.id}
            to={item.link}
            className={({ isActive }) =>
              isActive ? "text-purple-500 font-semibold" : "text-black hover:text-purple-400"
            }
          >
            {item.name}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default SideBarProfile;
