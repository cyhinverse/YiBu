import React, { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";

const SuccessNotification = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Chờ hiệu ứng mờ dần hoàn tất
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-green-200 dark:border-green-900 p-4 max-w-md transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <CheckCircle className="text-green-500 mr-3 flex-shrink-0" size={20} />
      <div className="mr-3">
        <p className="text-gray-800 dark:text-gray-200 font-medium">
          {message}
        </p>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-auto"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default SuccessNotification;
