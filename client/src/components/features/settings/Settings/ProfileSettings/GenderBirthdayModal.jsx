import React, { useRef, useEffect } from "react";

// Component cho modal chỉnh sửa giới tính và ngày sinh
const GenderBirthdayModal = ({
  title,
  tempData,
  handleCancel,
  handleSubmit,
}) => {
  const genderRef = useRef(null);
  const birthdayRef = useRef(null);

  // Hàm format lại ngày sinh để hiển thị trong input date
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0]; // Format YYYY-MM-DD
    } catch (error) {
      console.error("Lỗi khi format ngày:", error);
      return "";
    }
  };

  // Đặt giá trị ban đầu cho các field khi modal mở
  useEffect(() => {
    if (genderRef.current) genderRef.current.value = tempData.gender || "";
    if (birthdayRef.current)
      birthdayRef.current.value = formatDateForInput(tempData.birthday) || "";
  }, [tempData]);

  const onSubmit = (e) => {
    e.preventDefault();

    // Lấy giá trị mới nhất từ các input
    const newGender = genderRef.current ? genderRef.current.value : "";
    const newBirthday = birthdayRef.current ? birthdayRef.current.value : "";

    console.log("Giá trị gender mới nhập trực tiếp:", newGender);
    console.log("Giá trị birthday mới nhập trực tiếp:", newBirthday);

    // Tạo đối tượng dữ liệu để cập nhật
    const dataToUpdate = {
      gender: newGender,
      birthday: newBirthday,
    };

    // Truyền dữ liệu mới nhất trực tiếp cho hàm submit
    handleSubmit(dataToUpdate);
  };

  // Hàm ngăn chặn sự kiện click từ việc lan truyền
  const preventClickPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black/10 bg-opacity-50 flex items-center justify-center z-50"
      tabIndex="-1"
    >
      <div
        className="bg-white rounded-xl p-6 w-full max-w-md"
        onClick={preventClickPropagation}
      >
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giới tính
              </label>
              <select
                name="gender"
                ref={genderRef}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                autoFocus
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày sinh
              </label>
              <input
                type="date"
                name="birthday"
                ref={birthdayRef}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              />
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

export default GenderBirthdayModal;
