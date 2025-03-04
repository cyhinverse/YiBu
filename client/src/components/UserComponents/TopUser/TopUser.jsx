import React from "react";
import { Search } from "lucide-react";

const TopUser = ({ topUsers }) => {
  return (
    <div className="w-[300px] bg-white border border-gray-300 rounded-xl shadow-lg p-5">
      <h1 className="text-center text-2xl font-bold mb-5 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        Top Users of Day
      </h1>

      {/* Search box */}
      <div className="relative mb-5">
        <input
          type="text"
          placeholder="Search user..."
          className="w-full h-10 pl-4 pr-10 rounded-md border border-gray-300 outline-none focus:ring-2 focus:ring-purple-500"
        />
        <Search
          size={20}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
      </div>

      {/* User list */}
      <div className="flex flex-col gap-3">
        {topUsers.map((user, index) => (
          <div
            key={index}
            className="flex justify-between items-center px-4 py-2 rounded-md bg-gray-100 hover:bg-purple-100 transition"
          >
            <span className="font-medium">{user.name}</span>
            <span className="font-bold text-purple-600">{user.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopUser;
