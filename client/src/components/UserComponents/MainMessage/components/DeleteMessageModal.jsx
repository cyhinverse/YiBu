import React from "react";
import { X, Trash2, AlertCircle } from "lucide-react";

const DeleteMessageModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl transform transition-all duration-300 animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} className="text-red-500" />
            <h3 className="text-lg font-medium text-gray-900">
              Xác nhận xóa tin nhắn
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-t border-b border-gray-100 py-4 my-2">
          <p className="text-gray-600 text-sm leading-relaxed">
            Tin nhắn sẽ bị xóa đối với cả bạn và người nhận. Hành động này không
            thể hoàn tác.
          </p>
        </div>

        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 flex items-center justify-center space-x-1 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <Trash2 size={16} />
            <span>Xóa tin nhắn</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;
