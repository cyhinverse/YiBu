import React from "react";
import { X } from "lucide-react";

export const AdminModal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-scale-in">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const StatusBadge = ({ status, type = "default" }) => {
  const getStyles = () => {
    // Map status strings to colors
    const lowerStatus = status?.toLowerCase() || "";
    
    if (["active", "success", "resolved", "approved"].includes(lowerStatus)) {
      return "bg-green-100 text-green-800";
    }
    if (["banned", "error", "rejected", "deleted"].includes(lowerStatus)) {
      return "bg-red-100 text-red-800";
    }
    if (["pending", "warning", "idle"].includes(lowerStatus)) {
      return "bg-yellow-100 text-yellow-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStyles()}`}>
      {status}
    </span>
  );
};
