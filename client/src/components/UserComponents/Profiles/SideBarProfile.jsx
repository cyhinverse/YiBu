import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Save, Users } from "lucide-react";

const SideBarProfile = () => {
  const profileOptions = [
    {
      id: 1,
      name: "Trang chủ",
      link: "/profile/home",
      icon: <Home size={18} />,
    },
    {
      id: 3,
      name: "Friends",
      link: "/profile/friends",
      icon: <Users size={18} />,
    },
    {
      id: 4,
      name: "Save posts",
      link: "/profile/save-posts",
      icon: <Save size={18} />,
    },
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
                ? "text-purple-500 font-semibold flex items-center"
                : "text-black hover:text-purple-400 flex items-center"
            }
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default SideBarProfile;
