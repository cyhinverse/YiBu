import React from "react";
import AccountSection from "./AccountSection";

const PasswordSection = ({ openPasswordModal }) => {
  return (
    <AccountSection title="Mật khẩu">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 mb-1">Mật khẩu của bạn</p>
          <p className="text-gray-800 font-medium">••••••••</p>
        </div>
        <button
          onClick={openPasswordModal}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
        >
          Đổi mật khẩu
        </button>
      </div>
    </AccountSection>
  );
};

export default PasswordSection;
