import React from "react";

const ShowVideoPost = ({ setShowVideo, showVideo }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
      <div className="relative max-w-[90vw] max-h-[90vh]">
        <button
          className="absolute top-2 right-2 bg-gray-900 text-white rounded-full p-2 hover:bg-gray-700 transition-all z-10"
          onClick={() => setShowVideo(null)}
        >
          <X size={24} />
        </button>
        <div className="video-fullscreen-container">
          <video
            autoPlay
            controls
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-md"
          >
            <source src={showVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
};

export default ShowVideoPost;
