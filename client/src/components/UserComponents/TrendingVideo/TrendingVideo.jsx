import React from "react";
import { Heart } from "lucide-react";
const TrendingVideo = ({ color, setColor, videos }) => {
  return (
    <div className="flex-1 rounded-xl  shadow-xl overflow-y-scroll space-y-4 p-3 content-video border-t border-l border-gray-300 border-br">
      {videos.map((video, index) => (
        <div
          key={index}
          className="relative w-full h-[500px] rounded-xl overflow-hidden"
        >
          <video
            src={video.videoUrl}
            controls
            loop
            className="w-full h-full object-cover"
          ></video>
          <div className="absolute z-40 top-50 right-5">
            <Heart
              className="cursor-pointer"
              values={color}
              onClick={() => setColor(!color)}
              fill={color ? "red" : "white"}
              color={color ? "red" : "white"}
              size={30}
            />
          </div>
          <div className="absolute bottom-3 left-3 text-white ">
            <h3 className="font-bold">{video.user}</h3>
            <p>{video.caption}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrendingVideo;
