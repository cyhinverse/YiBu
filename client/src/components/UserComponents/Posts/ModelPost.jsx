import { AudioLines, Image, MapPin, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import POST from "../../../services/postService";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { addPost } from "../../../slices/PostSlice";

const ModelPost = ({ closeModal }) => {
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [title, setTitle] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      mediaPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [mediaPreviews]);

  const handleMediaChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const previewUrls = files.map((file) => URL.createObjectURL(file));

    setMediaPreviews((prev) => [...prev, ...previewUrls]);
    setMediaFiles((prev) => [...prev, ...files]);
    event.target.value = "";
  };

  const removeMedia = (index) => {
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePosts = async () => {
    try {
      const formData = new FormData();
      formData.append("title", title);
      setTitle("");

      mediaFiles.forEach((file) => {
        formData.append("media", file);
      });

      const res = await POST.CREATE_POST(formData);
      dispatch(addPost(res.post));

      if (res.code === 1) {
        toast.success(res.message);
        dispatch(addPost(res.post));
        setTitle("");
        setMediaFiles([]);
        setMediaPreviews([]);
      } else {
        toast.error("Upload failed");
      }
    } catch (error) {
      console.error("❌ Error creating post:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl relative">
        <button
          onClick={closeModal}
          className="absolute top-5 right-4 text-md text-black transition cursor-pointer"
        >
          Exit
        </button>

        <h2 className="text-md text-black mb-6">What do you think?</h2>

        <div className="flex gap-3 mb-4 items-start">
          <img
            src="https://plus.unsplash.com/premium_photo-1661404163778-8a72ca780190?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Avatar"
            className="h-12 w-12 rounded-full object-cover"
          />
          <div className="flex flex-col h-full w-full">
            <span>Hana</span>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Có ý tưởng mới?"
              className="flex-1 h-auto bg-transparent resize-none overflow-hidden leading-relaxed text-gray-800 placeholder-gray-400 border-none outline-none focus:ring-0"
            />
          </div>
        </div>

        {/* Hiển thị preview media */}
        {mediaPreviews.length > 0 && (
          <div className="mb-4 flex gap-3 overflow-x-auto scrollbar-hide">
            {mediaPreviews.map((preview, index) => (
              <div
                key={index}
                className="relative min-w-[128px] h-[128px] rounded-lg overflow-hidden group transition-transform"
              >
                <button
                  onClick={() => removeMedia(index)}
                  className="absolute top-1 right-1 bg-black text-white p-1 rounded-full shadow-lg hover:bg-red-700 transition"
                >
                  <X size={15} />
                </button>
                {preview.includes("video") ? (
                  <video
                    src={preview}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedImage(preview)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Các nút chọn media */}
        <div className="flex justify-between">
          <div className="flex items-center gap-4 text-gray-500 mb-6">
            <label className="p-2 rounded-full hover:bg-gray-100 transition cursor-pointer">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleMediaChange}
              />
              <Image className="w-5 h-5" />
            </label>
            <button className="p-2 rounded-full hover:bg-gray-100 transition">
              <AudioLines className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition">
              <MapPin className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handlePosts}
            className="w-[100px] h-[40px] bg-purple-600 text-white text-lg font-medium rounded-md hover:bg-purple-700 transition"
          >
            Post
          </button>
        </div>
      </div>

      {/* Hiển thị ảnh lớn khi click */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full Preview"
            className="max-w-full max-h-full rounded-lg shadow-lg"
          />
          <button
            className="absolute top-4 right-4 bg-white text-black p-2 rounded-full shadow-lg hover:bg-gray-200 transition"
            onClick={() => setSelectedImage(null)}
          >
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ModelPost;
