import React from "react";
import { NavLink } from "react-router-dom";

const SideBarProfile = () => {
  const profileOptions = [
    { id: 1, name: "Trang chủ", link: "/profile/home" },
    { id: 3, name: "Save posts", link: "/profile/save-posts" },
  ];
  return (
    <div className="min-w-[310px] h-fit shadow-md bg-white rounded-xl p-4">
      <div className="flex flex-col gap-4">
        {profileOptions.map((item) => (
          <NavLink
            key={item.id}
            to={item.link}
            className={({ isActive }) =>
              isActive
                ? "text-purple-500 font-semibold"
                : "text-black hover:text-purple-400"
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
