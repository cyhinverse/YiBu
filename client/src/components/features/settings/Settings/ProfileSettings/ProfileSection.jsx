import React from "react";

// Component hiển thị một section thông tin
const ProfileSection = ({
  title,
  content,
  editField,
  onEdit,
  isDisabled = false,
}) => (
  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
    <div className="flex justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {title}
        </h3>
        <div className="text-gray-700 dark:text-gray-300">{content}</div>
      </div>
      <button
        className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium h-fit"
        onClick={() => onEdit(editField)}
        disabled={isDisabled}
      >
        Chỉnh sửa
      </button>
    </div>
  </div>
);

export default ProfileSection;
