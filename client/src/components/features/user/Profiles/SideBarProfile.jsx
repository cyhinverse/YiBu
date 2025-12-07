import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Save, Users } from "lucide-react";
import { useSelector } from "react-redux";

const SideBarProfile = () => {
  const currentUser = useSelector((state) => state.auth?.user);

  // Lấy ID người dùng hiện tại từ Redux store
  const getCurrentUserId = () => {
    if (!currentUser) return null;

    if (currentUser._id) return currentUser._id;
    if (currentUser.id) return currentUser.id;
    if (currentUser.user?._id) return currentUser.user._id;
    if (currentUser.user?.id) return currentUser.user.id;
    if (currentUser.data?._id) return currentUser.data._id;
    if (currentUser.data?.id) return currentUser.data.id;

    return null;
  };

  const currentUserId = getCurrentUserId();
  const homeLink = currentUserId ? `/profile/${currentUserId}` : "/profile";

  const profileOptions = [
    {
      id: 1,
      name: "Trang chủ",
      link: homeLink,
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
                : " hover:text-purple-400 flex items-center"
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
