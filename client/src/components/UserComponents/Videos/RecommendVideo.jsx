import React from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";

const RecommendVideo = () => {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <video
        src="https://videos.pexels.com/video-files/30988823/13247245_1920_1080_25fps.mp4"
        className="w-full h-full object-cover border border-gray-300 shadow-md"
        autoPlay
        muted
        loop
      />

      <div className="absolute bottom-4 left-4 text-white">
        <h2 className="text-xl font-semibold">Exploring Nature 🌿</h2>
        <p className="text-sm text-gray-300">John Doe • 1.2M views</p>
      </div>

      <div className="absolute right-4 bottom-4 flex flex-col items-center gap-6">
        <button className="flex flex-col items-center text-white hover:text-red-500 transition">
          <Heart className="w-7 h-7" />
          <span className="text-sm mt-1">24K</span>
        </button>
        <button className="flex flex-col items-center text-white hover:text-blue-500 transition">
          <MessageCircle className="w-7 h-7" />
          <span className="text-sm mt-1">1.1K</span>
        </button>
        <button className="flex flex-col items-center text-white hover:text-green-500 transition">
          <Share2 className="w-7 h-7" />
          <span className="text-sm mt-1">Share</span>
        </button>
      </div>
    </div>
  );
};

export default RecommendVideo;
