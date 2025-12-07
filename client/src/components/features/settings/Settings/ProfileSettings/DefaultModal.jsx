import React, { useRef, useEffect } from "react";

// Component cho modal chỉnh sửa thông tin mặc định
const DefaultModal = ({
  title,
  tempData,
  handleCancel,
  handleSubmit,
  modalField, // Thêm tham số để biết đang chỉnh sửa trường nào
}) => {
  const inputRef = useRef(null);

  // Đặt giá trị ban đầu cho field khi modal mở
  useEffect(() => {
    if (inputRef.current) {
      // Xác định giá trị ban đầu dựa vào loại trường đang chỉnh sửa
      if (modalField === "bio") {
        inputRef.current.value = tempData.bio || "";
      } else if (modalField === "website") {
        inputRef.current.value = tempData.website || "";
      } else if (modalField === "name") {
        inputRef.current.value = tempData.name || "";
      }
    }
  }, [tempData, modalField]);

  const onSubmit = (e) => {
    e.preventDefault();

    // Lấy giá trị mới nhất từ input và truyền trực tiếp vào hàm submit
    if (inputRef.current) {
      const newValue = inputRef.current.value;
      console.log(`Giá trị ${modalField} mới nhập trực tiếp:`, newValue);

      // Tạo đối tượng dữ liệu để cập nhật
      const dataToUpdate = { [modalField]: newValue };

      // Truyền dữ liệu mới nhất trực tiếp cho hàm submit
      handleSubmit(dataToUpdate);
    }
  };

  // Hàm ngăn chặn sự kiện click từ việc lan truyền
  const preventClickPropagation = (e) => {
    e.stopPropagation();
  };

  // Xác định placeholder và label dựa vào trường đang chỉnh sửa
  const getFieldConfig = () => {
    switch (modalField) {
      case "bio":
        return {
          label: "Tiểu sử",
          placeholder: "Chia sẻ một chút về bạn...",
          type: "textarea",
          rows: 4,
        };
      case "website":
        return {
          label: "Website",
          placeholder: "https://example.com",
          type: "text",
        };
      case "name":
        return {
          label: "Tên hiển thị",
          placeholder: "Tên hiển thị của bạn",
          type: "text",
        };
      default:
        return {
          label: "Thông tin",
          placeholder: "Nhập thông tin",
          type: "text",
        };
    }
  };

  const fieldConfig = getFieldConfig();

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
                {fieldConfig.label}
              </label>
              {fieldConfig.type === "textarea" ? (
                <textarea
                  name={modalField}
                  ref={inputRef}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  rows={fieldConfig.rows}
                  placeholder={fieldConfig.placeholder}
                  autoFocus
                ></textarea>
              ) : (
                <input
                  type={fieldConfig.type}
                  name={modalField}
                  ref={inputRef}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder={fieldConfig.placeholder}
                  autoFocus
                />
              )}
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

export default DefaultModal;
