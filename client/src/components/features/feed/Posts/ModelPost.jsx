import { useState } from "react";
import { Image, X, Smile, Globe, Sparkles, Send } from "lucide-react";

// Fake user data
const CURRENT_USER = {
  name: "John Doe",
  username: "johndoe",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe",
};

const ModelPost = ({ closeModal }) => {
  const [caption, setCaption] = useState("");
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMediaChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const previewUrls = files.map((file) => URL.createObjectURL(file));
    setMediaPreviews((prev) => [...prev, ...previewUrls]);
    event.target.value = "";
  };

  const removeMedia = (index) => {
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = () => {
    if (!caption.trim() && mediaPreviews.length === 0) return;

    setIsLoading(true);
    // Simulate posting
    setTimeout(() => {
      setIsLoading(false);
      closeModal();
    }, 1000);
  };

  const canPost = caption.trim() || mediaPreviews.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[8vh] px-4 overflow-y-auto"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={closeModal}
            className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} className="text-neutral-400" />
          </button>
          <h2 className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
            <Sparkles size={14} className="text-neutral-500" />
            Create Post
          </h2>
          <div className="w-9" />
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex gap-3">
            {/* Avatar */}
            <img
              src={CURRENT_USER.avatar}
              alt={CURRENT_USER.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700 flex-shrink-0"
            />

            {/* Editor */}
            <div className="flex-1 min-w-0">
              {/* User info */}
              <div className="mb-2">
                <p className="font-semibold text-black dark:text-white text-sm">
                  {CURRENT_USER.name}
                </p>
                <button className="flex items-center gap-1.5 px-2.5 py-1 mt-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                  <Globe size={12} />
                  <span>Public</span>
                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                    <path d="M3.543 8.96l1.414-1.42L12 14.59l7.043-7.05 1.414 1.42L12 17.41 3.543 8.96z" />
                  </svg>
                </button>
              </div>

              {/* Text area */}
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-transparent resize-none text-black dark:text-white placeholder:text-neutral-400 border-none outline-none min-h-[100px] text-[15px] leading-relaxed"
                autoFocus
              />

              {/* Media previews */}
              {mediaPreviews.length > 0 && (
                <div
                  className={`mt-3 rounded-xl overflow-hidden ${
                    mediaPreviews.length > 1 ? "grid gap-1" : ""
                  } ${mediaPreviews.length === 2 ? "grid-cols-2" : ""} ${
                    mediaPreviews.length >= 3 ? "grid-cols-2" : ""
                  }`}
                >
                  {mediaPreviews.map((preview, index) => (
                    <div
                      key={index}
                      className={`relative ${
                        mediaPreviews.length === 1
                          ? "max-h-[350px]"
                          : "aspect-square"
                      } ${
                        mediaPreviews.length === 3 && index === 0
                          ? "row-span-2"
                          : ""
                      }`}
                    >
                      <button
                        onClick={() => removeMedia(index)}
                        className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-lg hover:bg-black/80 transition-colors"
                      >
                        <X size={14} />
                      </button>
                      <img
                        src={preview}
                        alt="Preview"
                        className={`w-full h-full object-cover cursor-pointer rounded-xl ${
                          mediaPreviews.length === 1 ? "max-h-[350px]" : ""
                        }`}
                        onClick={() => setSelectedImage(preview)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-neutral-200 dark:bg-neutral-800 mx-4" />

        {/* Action bar */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Media icons */}
          <div className="flex items-center gap-1">
            <label className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleMediaChange}
              />
              <Image
                size={18}
                className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors"
              />
            </label>
            <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group">
              <Smile
                size={18}
                className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors"
              />
            </button>
          </div>

          {/* Character count & Post button */}
          <div className="flex items-center gap-3">
            {caption.length > 0 && (
              <span
                className={`text-xs ${
                  caption.length > 280 ? "text-red-500" : "text-neutral-400"
                }`}
              >
                {caption.length}/280
              </span>
            )}
            <button
              onClick={handlePost}
              disabled={isLoading || !canPost}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                canPost && !isLoading
                  ? "bg-black dark:bg-white text-white dark:text-black hover:opacity-90"
                  : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={14} />
                  <span>Post</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Full image preview modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full Preview"
            className="max-w-[90vw] max-h-[90vh] rounded-xl"
          />
          <button
            className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm text-white p-2.5 rounded-xl hover:bg-white/20 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ModelPost;
