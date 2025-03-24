import React from "react";

const EmailModal = ({
  showEmailModal,
  closeEmailModal,
  newEmail,
  handleEmailChange,
  handleUpdateEmail,
  isUpdatingEmail,
}) => {
  if (!showEmailModal) return null;

  // Prevent click propagation to avoid modal closing when clicking inside
  const preventClickPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      tabIndex="-1"
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-md mx-auto"
        onClick={preventClickPropagation}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-purple-700">
            Cập nhật Email
          </h2>
          <button
            type="button"
            onClick={closeEmailModal}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdateEmail();
          }}
        >
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email mới
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={handleEmailChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              placeholder="Nhập email mới"
              autoFocus
            />
            <p className="text-sm text-gray-500 mt-2">
              Sau khi cập nhật, một email xác nhận sẽ được gửi đến địa chỉ mới.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={closeEmailModal}
              disabled={isUpdatingEmail}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isUpdatingEmail}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {isUpdatingEmail ? "Đang cập nhật..." : "Cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailModal;
