import React from "react";
import { Link } from "react-router-dom";
import {
  Dessert,
  Sparkle,
  Heart,
  Users,
  Gamepad2,
  Radio,
  Plane,
  Search,
} from "lucide-react";

const SideBarVideos = () => {
  const VideoOptions = [
    { id: 1, name: "Recommended", Icon: Heart, path: "/videos/recommended" },
    { id: 2, name: "Random", Icon: Sparkle, path: "/videos/random" },
    { id: 3, name: "Following", Icon: Dessert, path: "/videos/following" },
    { id: 4, name: "Friends", Icon: Users, path: "/videos/friends" },
    { id: 5, name: "Games", Icon: Gamepad2, path: "/videos/games" },
    { id: 6, name: "Live", Icon: Radio, path: "/videos/live" },
    { id: 7, name: "Travel", Icon: Plane, path: "/videos/travel" },
  ];

  return (
    <aside className="flex flex-col w-[260px] h-full bg-white border border-gray-300 rounded-2xl p-6">
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Search videos..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      </div>
      <nav className="flex flex-col gap-2">
        {VideoOptions.map(({ id, name, Icon, path }) => (
          <Link
            to={path}
            key={id}
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-purple-100 transition-all duration-200 group"
          >
            <Icon className="text-gray-700 w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-gray-800 text-lg font-medium">{name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default SideBarVideos;
