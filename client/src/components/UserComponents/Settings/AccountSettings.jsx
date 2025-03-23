import React, { useState, useEffect } from "react";
import Auth from "../../../services/authService";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../slices/AuthSlice";
import { useNavigate } from "react-router-dom";

const AccountSettings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  // Get user data from Redux store or localStorage
  const [userData, setUserData] = useState(null);

  // State for email change
  const [newEmail, setNewEmail] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // State for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // State for account verification
  const [isVerifying, setIsVerifying] = useState(false);

  // State for delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // State cho thông báo thành công
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successType, setSuccessType] = useState("");

  // Additional debugging at component initialization
  useEffect(() => {
    console.log("Auth state from Redux:", auth);
    try {
      const storedUserStr = localStorage.getItem("user");
      console.log("User from localStorage (raw):", storedUserStr);
      if (storedUserStr) {
        const parsedUser = JSON.parse(storedUserStr);
        console.log("User from localStorage (parsed):", parsedUser);
      }
    } catch (error) {
      console.error("Error debugging localStorage:", error);
    }
  }, []);

  // Get user data on component mount
  useEffect(() => {
    const getUserData = () => {
      // Try to get user data from Redux store
      if (auth && auth.user) {
        // Check for different possible structures of user data
        if (auth.user.email) {
          setUserData(auth.user);
          console.log("Found user email in auth.user:", auth.user.email);
          return;
        } else if (auth.user.user && auth.user.user.email) {
          setUserData(auth.user.user);
          console.log(
            "Found user email in auth.user.user:",
            auth.user.user.email
          );
          return;
        } else if (auth.user.data && auth.user.data.email) {
          setUserData(auth.user.data);
          console.log(
            "Found user email in auth.user.data:",
            auth.user.data.email
          );
          return;
        }
      }

      // If not found in Redux, try localStorage
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);

          // Check for different possible structures in localStorage too
          if (parsedUser.email) {
            setUserData(parsedUser);
            console.log("Found user email in localStorage:", parsedUser.email);
            return;
          } else if (parsedUser.user && parsedUser.user.email) {
            setUserData(parsedUser.user);
            console.log(
              "Found user email in localStorage.user:",
              parsedUser.user.email
            );
            return;
          } else if (parsedUser.data && parsedUser.data.email) {
            setUserData(parsedUser.data);
            console.log(
              "Found user email in localStorage.data:",
              parsedUser.data.email
            );
            return;
          }
        }

        console.error("User data found but no email property:", storedUser);
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
      }

      console.error(
        "No valid user data with email found in Redux or localStorage"
      );
    };

    getUserData();
  }, [auth]);

  // Function to safely get email from the userData object
  const getUserEmail = () => {
    if (!userData) return "Loading email...";

    if (userData.email) return userData.email;
    if (userData.user && userData.user.email) return userData.user.email;
    if (userData.data && userData.data.email) return userData.data.email;

    // If we still don't have an email, try directly from Redux or localStorage
    if (auth && auth.user) {
      if (auth.user.email) return auth.user.email;
      if (auth.user.user && auth.user.user.email) return auth.user.user.email;
      if (auth.user.data && auth.user.data.email) return auth.user.data.email;
    }

    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.email) return parsedUser.email;
        if (parsedUser.user && parsedUser.user.email)
          return parsedUser.user.email;
        if (parsedUser.data && parsedUser.data.email)
          return parsedUser.data.email;
      }
    } catch (error) {
      console.error("Error getting email from localStorage:", error);
    }

    return "Email not found";
  };

  // Handle email modal open
  const openEmailModal = () => {
    setNewEmail(getUserEmail() || "");
    setShowEmailModal(true);
  };

  // Handle email modal close
  const closeEmailModal = () => {
    setShowEmailModal(false);
    setNewEmail("");
    setIsUpdatingEmail(false);
  };

  // Handle email change
  const handleEmailChange = (e) => {
    setNewEmail(e.target.value);
  };

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user types
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Submit email change
  const handleUpdateEmail = async () => {
    if (!newEmail) {
      toast.error("Please enter a new email address");
      return;
    }

    setIsUpdatingEmail(true);
    try {
      // For demo/development purposes, we'll simulate a successful API call
      // In a real application, you'd use the actual API
      const res = { code: 1, message: "Email updated successfully!" };

      // When the Auth.updateEmail method is fully implemented, use this:
      // const res = await Auth.updateEmail(newEmail);

      if (res.code === 1) {
        toast.success(res.message || "Email updated successfully!");

        // Update user data in state with the new email
        // Updating userData should maintain the same structure as it was initialized
        if (userData) {
          let updatedUserData;

          if (userData.email) {
            // Direct email on user object
            updatedUserData = { ...userData, email: newEmail };
          } else if (userData.user && userData.user.email) {
            // Email is in a nested user object
            updatedUserData = {
              ...userData,
              user: { ...userData.user, email: newEmail },
            };
          } else if (userData.data && userData.data.email) {
            // Email is in a nested data object
            updatedUserData = {
              ...userData,
              data: { ...userData.data, email: newEmail },
            };
          } else {
            // Default fallback - add email directly to userData
            updatedUserData = { ...userData, email: newEmail };
          }

          setUserData(updatedUserData);
          console.log("Updated user data in state:", updatedUserData);

          // Update localStorage - we need to preserve the original structure
          try {
            const storedUserStr = localStorage.getItem("user");
            if (storedUserStr) {
              const storedUser = JSON.parse(storedUserStr);

              let updatedStoredUser;

              if (storedUser.email) {
                updatedStoredUser = { ...storedUser, email: newEmail };
              } else if (storedUser.user && storedUser.user.email) {
                updatedStoredUser = {
                  ...storedUser,
                  user: { ...storedUser.user, email: newEmail },
                };
              } else if (storedUser.data && storedUser.data.email) {
                updatedStoredUser = {
                  ...storedUser,
                  data: { ...storedUser.data, email: newEmail },
                };
              } else {
                // Default fallback
                updatedStoredUser = { ...storedUser, email: newEmail };
              }

              localStorage.setItem("user", JSON.stringify(updatedStoredUser));
              console.log("Updated user in localStorage:", updatedStoredUser);
            }
          } catch (error) {
            console.error("Error updating user data in localStorage:", error);
          }
        }

        // Hiển thị thông báo thành công
        setSuccessMessage("Email đã được cập nhật thành công");
        setSuccessType("email");
        setShowSuccess(true);

        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);

        closeEmailModal();
      } else {
        toast.error(res.message || "Failed to update email");
      }
    } catch (error) {
      console.log(`Error updating email: ${error}`);
      toast.error("Failed to update email");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const openPasswordModal = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
    setIsUpdatingPassword(false);
  };

  const validatePassword = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Mật khẩu phải có ít nhất 8 ký tự";
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Vui lòng nhập lại mật khẩu mới";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Mật khẩu nhập lại không khớp";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdatePassword = async () => {
    try {
      if (!validatePassword()) {
        return;
      }

      setIsUpdatingPassword(true);

      const response = await Auth.updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (response.success) {
        // Hiển thị thông báo thành công
        setSuccessMessage("Mật khẩu đã được cập nhật thành công");
        setSuccessType("password");
        setShowSuccess(true);

        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);

        toast.success("Cập nhật mật khẩu thành công!");
        closePasswordModal();
      } else {
        toast.error(response.message || "Cập nhật mật khẩu thất bại");
        // Set specific errors if returned from server
        if (response.errors) {
          setPasswordErrors(response.errors);
        }
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Có lỗi xảy ra khi cập nhật mật khẩu");
      if (error.response?.data?.message === "Current password is incorrect") {
        setPasswordErrors({
          currentPassword: "Mật khẩu hiện tại không chính xác",
        });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle account verification
  const handleVerifyAccount = async () => {
    try {
      setIsVerifying(true);
      const response = await Auth.verifyAccount();
      if (response.success) {
        toast.success(
          "Email xác thực đã được gửi! Vui lòng kiểm tra hòm thư của bạn."
        );
      } else {
        toast.error(response.message || "Không thể gửi email xác thực");
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast.error("Có lỗi xảy ra khi gửi email xác thực");
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await Auth.deleteAccount();
      if (res.code === 1) {
        toast.success(res.message || "Account deleted successfully");
        dispatch(logout());
        navigate("/auth/login");
      } else {
        toast.error(res.message || "Failed to delete account");
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.log(`Error deleting account: ${error}`);
      toast.error("Failed to delete account");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await Auth.logout();
      if (res.code === 1) {
        toast.success(res.message || "Logout successful");
        dispatch(logout());
        navigate("/auth/login");
      } else {
        toast.error(res.message || "Logout failed!");
      }
    } catch (error) {
      console.log(`Error ${error}`);
      toast.error("Something went wrong!");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Email Modal Component
  const EmailModal = () => {
    if (!showEmailModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-purple-700">
              Cập nhật Email
            </h2>
            <button
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
            />
            <p className="text-sm text-gray-500 mt-2">
              Sau khi cập nhật, một email xác nhận sẽ được gửi đến địa chỉ mới.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={closeEmailModal}
              disabled={isUpdatingEmail}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Hủy
            </button>
            <button
              onClick={handleUpdateEmail}
              disabled={isUpdatingEmail}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {isUpdatingEmail ? "Đang cập nhật..." : "Cập nhật"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Password Modal Component
  const PasswordModal = () => {
    if (!showPasswordModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-purple-700">
              Đổi mật khẩu
            </h2>
            <button
              onClick={closePasswordModal}
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

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className={`w-full p-2 border ${
                  passwordErrors.currentPassword
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:ring-purple-500 focus:border-purple-500`}
                placeholder="Nhập mật khẩu hiện tại"
              />
              {passwordErrors.currentPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {passwordErrors.currentPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className={`w-full p-2 border ${
                  passwordErrors.newPassword
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:ring-purple-500 focus:border-purple-500`}
                placeholder="Nhập mật khẩu mới"
              />
              {passwordErrors.newPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {passwordErrors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className={`w-full p-2 border ${
                  passwordErrors.confirmPassword
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:ring-purple-500 focus:border-purple-500`}
                placeholder="Nhập lại mật khẩu mới"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={closePasswordModal}
              disabled={isUpdatingPassword}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Hủy
            </button>
            <button
              onClick={handleUpdatePassword}
              disabled={isUpdatingPassword}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {isUpdatingPassword ? "Đang cập nhật..." : "Cập nhật"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Success Notification Component
  const SuccessNotification = () => {
    if (!showSuccess) return null;

    // Tạo style dựa trên loại thông báo
    let bgColor = "bg-green-100";
    let borderColor = "border-green-500";
    let textColor = "text-green-700";
    let iconColor = "text-green-500";

    if (successType === "password") {
      bgColor = "bg-blue-100";
      borderColor = "border-blue-500";
      textColor = "text-blue-700";
      iconColor = "text-blue-500";
    } else if (successType === "verification") {
      bgColor = "bg-purple-100";
      borderColor = "border-purple-500";
      textColor = "text-purple-700";
      iconColor = "text-purple-500";
    }

    return (
      <div
        className={`fixed bottom-5 right-5 ${bgColor} border-l-4 ${borderColor} ${textColor} p-4 rounded shadow-md z-50 animate-fade-in-up`}
      >
        <div className="flex items-center">
          <svg
            className={`h-6 w-6 ${iconColor} mr-2`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p>{successMessage}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-purple-700">
        Cài Đặt Tài Khoản
      </h1>

      <div className="space-y-8">
        {/* Email Section */}
        <div className="bg-gray-50 p-5 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Email</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 mb-1">Email hiện tại</p>
              <p className="text-gray-800 font-medium">{getUserEmail()}</p>
            </div>
            <button
              onClick={openEmailModal}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
            >
              Thay đổi
            </button>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-gray-50 p-5 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Mật khẩu</h2>
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
        </div>

        {/* Account Verification Section */}
        <div className="bg-gray-50 p-5 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Xác minh tài khoản
          </h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 mb-1">Trạng thái</p>
              <p className="text-gray-800 font-medium">
                {userData?.isVerified ? (
                  <span className="text-green-600">Đã xác minh</span>
                ) : (
                  <span className="text-yellow-600">Chưa xác minh</span>
                )}
              </p>
            </div>
            {!userData?.isVerified && (
              <button
                onClick={handleVerifyAccount}
                disabled={isVerifying}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
              >
                {isVerifying ? "Đang gửi..." : "Gửi email xác minh"}
              </button>
            )}
          </div>
        </div>

        {/* Account Actions Section */}
        <div className="bg-gray-50 p-5 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Hành động tài khoản
          </h2>

          <div className="space-y-5">
            {/* Logout action */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <div>
                <p className="text-gray-800 font-medium">Đăng xuất</p>
                <p className="text-gray-500 text-sm">
                  Đăng xuất khỏi tài khoản của bạn
                </p>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
              >
                {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </button>
            </div>

            {/* Delete account action */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-red-600 font-medium">Xóa tài khoản</p>
                <p className="text-gray-500 text-sm">
                  Xóa vĩnh viễn tài khoản và dữ liệu của bạn
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition"
              >
                Xóa tài khoản
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              Xác nhận xóa tài khoản
            </h2>
            <p className="text-gray-700 mb-6">
              Bạn chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác
              và sẽ xóa vĩnh viễn tất cả dữ liệu của bạn.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                {isDeleting ? "Đang xóa..." : "Xóa tài khoản"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <EmailModal />
      <PasswordModal />

      {/* Success notification */}
      <SuccessNotification />
    </div>
  );
};

export default AccountSettings;
