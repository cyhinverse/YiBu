import { X } from "lucide-react";

const ShowImagePost = ({ setShowImage, showImage }) => {
  if (!showImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={() => setShowImage(null)}
    >
      <button
        className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
        onClick={() => setShowImage(null)}
      >
        <X size={20} />
      </button>
      <img
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
        src={showImage}
        alt="Full Image"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default ShowImagePost;
