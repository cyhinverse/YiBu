import React, { useRef, useEffect } from "react";

// Component cho modal chỉnh sửa sở thích
const InterestsModal = ({ title, tempData, handleCancel, handleSubmit }) => {
  const interestsRef = useRef(null);

  // Đặt giá trị ban đầu cho field khi modal mở
  useEffect(() => {
    if (interestsRef.current)
      interestsRef.current.value = tempData.interests || "";
  }, [tempData]);

  const onSubmit = (e) => {
    e.preventDefault();

    // Lấy giá trị mới nhất từ textarea
    if (interestsRef.current) {
      const newValue = interestsRef.current.value;
      console.log("Giá trị interests mới nhập trực tiếp:", newValue);

      // Tạo đối tượng dữ liệu để cập nhật
      const dataToUpdate = { interests: newValue };

      // Truyền dữ liệu mới nhất trực tiếp cho hàm submit
      handleSubmit(dataToUpdate);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/10 bg-opacity-50 flex items-center justify-center z-50"
      tabIndex="-1"
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sở thích (phân cách bằng dấu phẩy)
              </label>
              <textarea
                name="interests"
                ref={interestsRef}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                rows="4"
                placeholder="Ví dụ: Thể thao, Âm nhạc, Đọc sách..."
                autoFocus
              ></textarea>
            </div>
          </div>
          <div className="flex space-x-2 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterestsModal;
