import React from "react";

// Component hiển thị một section thông tin
const ProfileSection = ({
  title,
  content,
  editField,
  onEdit,
  isDisabled = false,
}) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <button
        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
        onClick={() => onEdit(editField)}
        disabled={isDisabled}
      >
        Chỉnh sửa
      </button>
    </div>
    {content}
  </div>
);

export default ProfileSection;
