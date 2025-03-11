import React from "react";
import {
  Play,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  Home,
  Search,
  Library,
} from "lucide-react";

const Music = () => {
  return (
    <div className="w-[95vw] h-[86vh] mt-5 shadow-md rounded-xl m-auto flex flex-col md:flex-row gap-6 p-6 bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="md:w-64 bg-gray-800 rounded-2xl p-6 flex flex-col gap-6">
        <h2 className="text-3xl font-extrabold tracking-wide">Music App</h2>
        <nav className="flex flex-col gap-4">
          <button className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-xl transition">
            <Home size={20} /> Home
          </button>
          <button className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-xl transition">
            <Search size={20} /> Search
          </button>
          <button className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-xl transition">
            <Library size={20} /> Your Library
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-6 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-800 p-4 rounded-2xl hover:scale-105 transition duration-300"
              >
                <div className="aspect-square bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <span className="text-4xl">🎵</span>
                </div>
                <h3 className="font-bold text-lg truncate">
                  Song Title {i + 1}
                </h3>
                <p className="text-sm opacity-80 truncate">Artist Name</p>
              </div>
            ))}
          </div>
        </div>

        {/* Player Controls */}
        <div className="h-[70px] bg-gray-800 rounded-2xl flex items-center justify-between px-8 border border-gray-700">
          {/* Current Playing Info */}
          <div className="flex items-center gap-4 w-1/4">
            <div className="w-[50px] h-[50px] bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-lg">🎵</span>
            </div>
            <div className="flex flex-col">
              <h4 className="font-bold text-sm">Song Title</h4>
              <p className="text-xs opacity-80">Artist Name</p>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="w-1/2 flex flex-col items-center gap-1">
            <div className="flex gap-6 items-center">
              <Shuffle size={20} className="hover:text-yellow-300 transition" />
              <SkipBack
                size={20}
                className="hover:text-yellow-300 transition"
              />
              <button className="bg-white text-black rounded-full p-3 hover:scale-110 transition">
                <Play size={18} />
              </button>
              <SkipForward
                size={20}
                className="hover:text-yellow-300 transition"
              />
              <Repeat size={20} className="hover:text-yellow-300 transition" />
            </div>
            <div className="w-full flex items-center gap-2 text-xs">
              <span>2:30</span>
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
              </div>
              <span>3:45</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="w-1/4 flex justify-end items-center gap-3">
            <Volume2 size={20} className="hover:text-yellow-300 transition" />
            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Music;
