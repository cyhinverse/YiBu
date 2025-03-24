import React from "react";
import AccountSection from "./AccountSection";

const VerificationSection = ({
  isVerified,
  handleVerifyAccount,
  isVerifying,
}) => {
  return (
    <AccountSection title="Xác minh tài khoản">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 mb-1">Trạng thái</p>
          <p className="text-gray-800 font-medium">
            {isVerified ? (
              <span className="text-green-600">Đã xác minh</span>
            ) : (
              <span className="text-yellow-600">Chưa xác minh</span>
            )}
          </p>
        </div>
        {!isVerified && (
          <button
            onClick={handleVerifyAccount}
            disabled={isVerifying}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
          >
            {isVerifying ? "Đang gửi..." : "Gửi email xác minh"}
          </button>
        )}
      </div>
    </AccountSection>
  );
};

export default VerificationSection;
