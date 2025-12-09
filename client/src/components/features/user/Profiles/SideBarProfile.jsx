import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, Settings, Bookmark, Users, Lock, Check } from "lucide-react";

// Fake user for sidebar
const FAKE_USER = {
  _id: "johndoe",
  name: "John Doe",
  username: "johndoe",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe",
  isVerified: true,
  following: 234,
  followers: 1520,
};

const menuItems = [
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
  {
    id: "saved",
    label: "Saved Posts",
    icon: Bookmark,
    path: "/profile/save-posts",
  },
  {
    id: "following",
    label: "Following",
    icon: Users,
    path: "/profile/following",
  },
  { id: "friends", label: "Friends", icon: Users, path: "/profile/friends" },
  { id: "privacy", label: "Privacy", icon: Lock, path: "/settings/privacy" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

const SideBarProfile = () => {
  const location = useLocation();

  return (
    <aside className="w-64 h-fit sticky top-20 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
      {/* User Info */}
      <div className="flex items-center gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="relative">
          <img
            src={FAKE_USER.avatar}
            alt={FAKE_USER.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
          />
          {FAKE_USER.isVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center border-2 border-white dark:border-neutral-900">
              <Check size={8} className="text-white dark:text-black" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-black dark:text-white truncate">
            {FAKE_USER.name}
          </p>
          <p className="text-sm text-neutral-500 truncate">
            @{FAKE_USER.username}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-around py-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="text-center">
          <p className="font-bold text-black dark:text-white">
            {FAKE_USER.following}
          </p>
          <p className="text-xs text-neutral-500">Following</p>
        </div>
        <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-700" />
        <div className="text-center">
          <p className="font-bold text-black dark:text-white">
            {FAKE_USER.followers}
          </p>
          <p className="text-xs text-neutral-500">Followers</p>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="pt-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white"
              }`}
            >
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default SideBarProfile;
