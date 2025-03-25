import React from "react";
import { MessageSquare } from "lucide-react";

const EmptyState = ({ title, message, icon }) => {
  return (
    <div className="text-center p-8 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex justify-center mb-3">
        {icon || <MessageSquare size={40} className="text-gray-400" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500">{message}</p>
    </div>
  );
};

export default EmptyState;
