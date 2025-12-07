import React from "react";
import { X } from "lucide-react";

const ShowImagePost = ({ setShowImage, showImage }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="relative">
        <button
          className="absolute top-2 right-2 bg-gray-900 text-white rounded-full p-2 hover:bg-gray-700 transition-all"
          onClick={() => setShowImage(null)}
        >
          <X size={24} />
        </button>
        <img
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-md"
          src={showImage}
          alt="Full Image"
        />
      </div>
    </div>
  );
};

export default ShowImagePost;
