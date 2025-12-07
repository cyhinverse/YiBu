import React from "react";
import AccountSection from "./AccountSection";
import { CheckCircle, SendIcon } from "lucide-react";

const VerificationSection = ({ isVerifying, onVerify }) => {
  return (
    <AccountSection title="Xác minh tài khoản">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <p className="text-gray-500 dark:text-gray-400 mb-1 text-sm">
            Xác minh email của bạn
          </p>
          <p className="text-gray-800 dark:text-gray-200">
            Xác minh tài khoản để đảm bảo bảo mật và mở khóa tất cả tính năng
          </p>
        </div>
        <button
          onClick={onVerify}
          disabled={isVerifying}
          className={`settings-button flex items-center gap-2 ${
            isVerifying
              ? "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              : "settings-button-primary bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white"
          }`}
        >
          {isVerifying ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-gray-600 border-t-transparent animate-spin"></div>
              <span>Đang gửi...</span>
            </>
          ) : (
            <>
              <SendIcon size={16} />
              <span>Gửi email xác minh</span>
            </>
          )}
        </button>
      </div>
    </AccountSection>
  );
};

export default VerificationSection;
