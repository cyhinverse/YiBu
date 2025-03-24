import React from "react";
import { Send, Image, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { toast } from "react-hot-toast";

const MessageInputArea = ({
  messageText,
  handleInputChange,
  handleKeyDown,
  sendMessage,
  sendingMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  handleEmojiSelect,
  previewImage,
  cancelImageUpload,
  fileInputRef,
  sendQuickReply,
}) => {
  return (
    <div className="px-4 py-3 border-t border-gray-100 flex flex-col bg-white flex-shrink-0">
      {/* Preview image */}
      {previewImage && (
        <div className="mb-3 relative">
          <div className="rounded-lg overflow-hidden max-h-40 inline-block shadow-sm">
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-40 object-contain"
            />
          </div>
          <button
            onClick={cancelImageUpload}
            className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-gray-700 transition-colors shadow-md"
          >
            &times;
          </button>
        </div>
      )}

      <div className="relative flex items-center gap-1">
        {/* Image upload button */}
        <button
          className="flex-none cursor-pointer p-2.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-all duration-200"
          onClick={() => fileInputRef.current?.click()}
        >
          <Image size={20} />
        </button>

        {/* Message input field */}
        <div className="flex-1 bg-gray-50 rounded-full border border-gray-200 focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-200 transition-all duration-200">
          <div className="flex w-full items-center">
            <input
              id="messageInput"
              type="text"
              placeholder="Nhập tin nhắn..."
              value={messageText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-1 py-2.5 px-4 bg-transparent outline-none text-gray-800 placeholder-gray-500 text-sm"
              disabled={sendingMessage}
            />

            {/* Emoji picker */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-500 hover:text-yellow-500 transition-all duration-200"
              >
                <Smile size={20} />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-12 right-0 z-10 shadow-xl rounded-lg overflow-hidden">
                  <EmojiPicker
                    onEmojiClick={handleEmojiSelect}
                    width={300}
                    height={350}
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Send button */}
        <button
          onClick={sendMessage}
          disabled={(!messageText.trim() && !previewImage) || sendingMessage}
          className={`flex-none ml-1 p-3 rounded-full shadow-sm ${
            (!messageText.trim() && !previewImage) || sendingMessage
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-200"
          }`}
        >
          <Send size={18} />
        </button>
      </div>

      {/* Quick reactions */}
      <div className="flex mt-2 space-x-2 justify-start">
        <button
          onClick={() => sendQuickReply("👍")}
          className="p-2 text-lg bg-white hover:bg-gray-100 rounded-full transition-all duration-200 border border-gray-200 shadow-sm"
        >
          👍
        </button>
        <button
          onClick={() => sendQuickReply("❤️")}
          className="p-2 text-lg bg-white hover:bg-gray-100 rounded-full transition-all duration-200 border border-gray-200 shadow-sm"
        >
          ❤️
        </button>
        <button
          onClick={() => sendQuickReply("😊")}
          className="p-2 text-lg bg-white hover:bg-gray-100 rounded-full transition-all duration-200 border border-gray-200 shadow-sm"
        >
          😊
        </button>
        <button
          onClick={() => sendQuickReply("🙏")}
          className="p-2 text-lg bg-white hover:bg-gray-100 rounded-full transition-all duration-200 border border-gray-200 shadow-sm"
        >
          🙏
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;

          if (!file.type.startsWith("image/")) {
            toast.error("Only image files are supported");
            return;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            cancelImageUpload();

            // Cài đặt file và preview
            const fileInput = document.querySelector('input[type="file"]');
            const file = fileInput.files[0];

            if (file) {
              // Set image file for upload
              if (typeof window !== "undefined") {
                const reader = new FileReader();
                reader.onload = (e) => {
                  document.getElementById("previewImage").src = e.target.result;
                };
                reader.readAsDataURL(file);
              }
            }
          };
          reader.readAsDataURL(file);
        }}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default MessageInputArea;
