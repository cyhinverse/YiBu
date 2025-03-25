import React, { memo, useState } from "react";
import { XCircle, UserPlus, Info } from "lucide-react";

// Tối ưu hóa với memo
const AddUserModal = memo(
  ({
    setShowAddUserModal,
    newUserData,
    handleNewUserChange,
    handleAddUser,
    isLoading,
  }) => {
    // Trạng thái validation
    const [errors, setErrors] = useState({
      name: false,
      username: false,
      email: false,
      password: false,
    });

    // Xử lý khi click ngoài modal
    const handleModalClick = (e) => {
      if (e.target === e.currentTarget) {
        setShowAddUserModal(false);
      }
    };

    // Xử lý validate form trước khi submit
    const handleSubmit = (e) => {
      e.preventDefault();

      // Kiểm tra validation
      const newErrors = {
        name: !newUserData.name,
        username: !newUserData.username,
        email:
          !newUserData.email ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserData.email),
        password: !newUserData.password || newUserData.password.length < 6,
      };

      setErrors(newErrors);

      // Nếu không có lỗi thì submit
      if (!Object.values(newErrors).some(Boolean)) {
        handleAddUser(e);
      }
    };

    // Handle input change and reset errors
    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;

      // Sử dụng lại hàm handleNewUserChange từ props để cập nhật giá trị
      handleNewUserChange(e);

      // Reset error for this field khi có giá trị
      if (
        // Kiểm tra checkbox
        (type === "checkbox" && errors[name]) ||
        // Kiểm tra input thông thường
        (value && errors[name])
      ) {
        setErrors({ ...errors, [name]: false });
      }
    };

    return (
      <div
        className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleModalClick}
      >
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <UserPlus size={20} className="mr-2 text-green-500" />
                Thêm người dùng mới
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newUserData.name}
                    onChange={handleChange}
                    className={`w-full border ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    } rounded-md p-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Nhập họ tên người dùng"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <Info size={14} className="mr-1" />
                      Vui lòng nhập họ tên người dùng
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={newUserData.username}
                    onChange={handleChange}
                    className={`w-full border ${
                      errors.username ? "border-red-500" : "border-gray-300"
                    } rounded-md p-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Nhập tên đăng nhập"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <Info size={14} className="mr-1" />
                      Vui lòng nhập tên đăng nhập
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newUserData.email}
                    onChange={handleChange}
                    className={`w-full border ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    } rounded-md p-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Nhập địa chỉ email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <Info size={14} className="mr-1" />
                      Vui lòng nhập địa chỉ email hợp lệ
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={newUserData.password}
                    onChange={handleChange}
                    className={`w-full border ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    } rounded-md p-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Nhập mật khẩu"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <Info size={14} className="mr-1" />
                      Mật khẩu phải có ít nhất 6 ký tự
                    </p>
                  )}
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="isAdmin"
                      name="isAdmin"
                      checked={newUserData.isAdmin}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="isAdmin"
                      className="text-sm font-medium text-gray-700"
                    >
                      Phân quyền Admin
                    </label>
                    <p className="text-xs text-gray-500">
                      Người dùng này sẽ có quyền quản trị hệ thống
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2 align-middle"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    "Thêm người dùng"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
);

AddUserModal.displayName = "AddUserModal";

export default AddUserModal;
