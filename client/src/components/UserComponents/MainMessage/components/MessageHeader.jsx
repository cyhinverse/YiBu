import React from "react";
import { ArrowLeft, Phone, Video, Info } from "lucide-react";

const MessageHeader = ({ receiverUser, goBack }) => {
  return (
    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm flex-shrink-0">
      <div className="flex items-center">
        <button
          onClick={goBack}
          className="mr-3 p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-all duration-200"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center">
          <div className="relative">
            <img
              src={receiverUser?.avatar || "https://via.placeholder.com/40"}
              alt={receiverUser?.name || "User"}
              className="w-11 h-11 rounded-full object-cover border border-gray-200"
            />
            {receiverUser?.online && (
              <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="ml-3">
            <p className="font-medium text-gray-900 leading-tight">
              {receiverUser?.name || "User"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {receiverUser?.online ? "Đang hoạt động" : "Không hoạt động"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex space-x-1">
        <button className="p-2.5 rounded-full hover:bg-gray-100 text-gray-600 transition-all duration-200">
          <Phone size={18} />
        </button>
        <button className="p-2.5 rounded-full hover:bg-gray-100 text-gray-600 transition-all duration-200">
          <Video size={18} />
        </button>
        <button className="p-2.5 rounded-full hover:bg-gray-100 text-gray-600 transition-all duration-200">
          <Info size={18} />
        </button>
      </div>
    </div>
  );
};

export default MessageHeader;
