import { X } from "lucide-react";

const ShowVideoPost = ({ setShowVideo, showVideo }) => {
  if (!showVideo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={() => setShowVideo(null)}
    >
      <button
        className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors z-10"
        onClick={() => setShowVideo(null)}
      >
        <X size={20} />
      </button>
      <video
        autoPlay
        controls
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <source src={showVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default ShowVideoPost;
