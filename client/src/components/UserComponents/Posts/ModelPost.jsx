import { AudioLines, Image, MapPin } from "lucide-react";
import React from "react";

const ModelPost = ({ closeModal }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/20 p-4">
      <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={closeModal}
          className="absolute top-5   right-4 text-md text-black  transition cursor-pointer"
        >
          Exit
        </button>

        {/* Title */}
        <h2 className="text-md  text-black mb-6">What do you think?</h2>

        {/* Input section */}
        <div className="flex gap-3 mb-4 items-start">
          <img
            src="https://plus.unsplash.com/premium_photo-1661404163778-8a72ca780190?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Avatar"
            className="h-12 w-12 rounded-full object-cover "
          />
          <div className="flex flex-col h-full w-full">
            <span>Hana</span>
            <textarea
              placeholder="Có ý tưởng mới ?"
              className="flex-1 h-auto bg-transparent  resize-none overflow-hidden leading-relaxed text-gray-800 placeholder-gray-400 border-none outline-none focus:ring-0"
            />
          </div>
        </div>
        <div className="flex justify-between">
          <div className="flex items-center gap-4 text-gray-500 mb-6">
            <button className="p-2 rounded-full hover:bg-gray-100 transition">
              <Image className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition">
              <AudioLines className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition">
              <MapPin className="w-5 h-5" />
            </button>
          </div>

          <button className="w-[100px] h-[40px] bg-purple-600 text-white text-lg font-medium rounded-md hover:bg-purple-700 transition">
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelPost;
