import React, { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useContext } from "react";
import { DataContext } from "../../../DataProvider";

const MiniPlayerMess = () => {
  const [playPause, setPlayPause] = useState(false);
  const { showHideMusic } = useContext(DataContext);

  return (
    !showHideMusic && (
      <div className="w-[400px] h-full bg-white border border-gray-300  rounded-xl p-4 flex flex-col justify-between shadow-xl">
        <div className="text-xl font-bold text-center">🎶 Now Playing</div>

        <div className="w-full aspect-square rounded-xl overflow-hidden mt-4">
          <img
            src="https://images.unsplash.com/photo-1520167112707-56e25f2d7d6e?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Now playing"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Song Info */}
        <div className="mt-4 text-center">
          <h2 className="text-lg font-semibold">Flowers</h2>
          <p className="text-sm text-gray-500">Miley Cyrus</p>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <input
            type="range"
            className="w-full accent-purple-500 cursor-pointer"
            min="0"
            max="100"
            value="30"
            onChange={() => {}}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1:15</span>
            <span>3:20</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-6 mt-4">
          <button className="text-gray-600 hover:text-purple-500">
            <SkipBack size={24} />
          </button>
          <button
            onClick={() => setPlayPause(!playPause)}
            className="bg-purple-500 p-3 rounded-full text-white hover:bg-purple-600 transition-transform hover:scale-110 cursor-pointer"
          >
            {playPause ? <Play size={28} /> : <Pause size={28} />}
          </button>
          <button className="text-gray-600 hover:text-purple-500">
            <SkipForward size={24} />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 mt-6">
          <Volume2 size={20} className="text-gray-500" />
          <input
            type="range"
            className="w-full accent-purple-500 cursor-pointer"
            min="0"
            max="100"
            value="50"
            onChange={() => {}}
          />
        </div>
      </div>
    )
  );
};

export default MiniPlayerMess;
