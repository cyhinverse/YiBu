import React, { useState, useEffect } from "react";
import Auth from "../../../services/authService";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { logout, login } from "../../../slices/AuthSlice";
import { useNavigate } from "react-router-dom";

// Import các component con đã tách
import {
  EmailSection,
  PasswordSection,
  VerificationSection,
  AccountActionsSection,
  EmailModal,
  PasswordModal,
  DeleteAccountModal,
  SuccessNotification,
} from "./AccountSettings/index";

const AccountSettings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const [userData, setUserData] = useState(null);

  const [newEmail, setNewEmail] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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

  // Effect to update UI when auth state changes
  useEffect(() => {
    console.log("Auth or userData changed, updating UI");

    // Update email display in real-time
    const emailElement = document.querySelector(".account-email-display");
    if (emailElement && userData) {
      const currentEmail = getUserEmail();
      if (
        currentEmail &&
        currentEmail !== "Email not found" &&
        currentEmail !== "Loading email..."
      ) {
        emailElement.textContent = currentEmail;
        console.log("Updated email display to:", currentEmail);
      }
    }
  }, [userData, auth?.user]);

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
      // Call the actual Auth.updateEmail method
      const res = await Auth.updateEmail(newEmail);

      if (res.code === 1) {
        toast.success(res.message || "Email updated successfully!");

        // Create updated user data based on current structure
        let updatedUserData;
        if (userData.email) {
          updatedUserData = { ...userData, email: newEmail };
        } else if (userData.user && userData.user.email) {
          updatedUserData = {
            ...userData,
            user: { ...userData.user, email: newEmail },
          };
        } else if (userData.data && userData.data.email) {
          updatedUserData = {
            ...userData,
            data: { ...userData.data, email: newEmail },
          };
        } else {
          updatedUserData = { ...userData, email: newEmail };
        }

        // Update local component state immediately
        setUserData(updatedUserData);
        console.log("Updated user data in state:", updatedUserData);

        // Manually update the UI element
        const emailElement = document.querySelector(".account-email-display");
        if (emailElement) {
          emailElement.textContent = newEmail;
          console.log("Directly updated email display to:", newEmail);
        }

        // Update localStorage and Redux state
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
              updatedStoredUser = { ...storedUser, email: newEmail };
            }

            // Update localStorage
            localStorage.setItem("user", JSON.stringify(updatedStoredUser));
            console.log("Updated user in localStorage:", updatedStoredUser);

            // Update Redux global state
            dispatch(login(updatedStoredUser));
          }
        } catch (error) {
          console.error("Error updating user data in localStorage:", error);
        }

        // Hiển thị thông báo thành công
        setSuccessMessage("Email đã được cập nhật thành công");
        setShowSuccessNotification(true);

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
    setPasswordErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
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
        setShowSuccessNotification(true);

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
          `Email xác thực đã được gửi tới ${
            response.email || "địa chỉ email của bạn"
          }. Vui lòng kiểm tra hòm thư.`
        );

        // Cập nhật trạng thái người dùng nếu cần
        setUserData((prev) => ({
          ...prev,
          verificationRequested: true,
        }));
      } else {
        toast.error(response.message || "Không thể gửi email xác thực");
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast.error(
        "Có lỗi xảy ra khi gửi email xác thực. Vui lòng thử lại sau."
      );
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
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.log(`Error deleting account: ${error}`);
      toast.error("Failed to delete account");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
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
    }
  };

  return (
    <div className="fade-in space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Tài khoản
        </h2>
        {verificationSent && (
          <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
            Email xác thực đã được gửi
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <EmailSection
          email={userData?.email}
          isVerified={userData?.isVerified}
          onUpdateEmail={openEmailModal}
        />

        <PasswordSection onUpdatePassword={openPasswordModal} />

        {!userData?.isVerified && (
          <VerificationSection
            isVerifying={isVerifying}
            onVerify={handleVerifyAccount}
          />
        )}

        <AccountActionsSection
          onDelete={() => setShowDeleteModal(true)}
          onLogout={handleLogout}
        />
      </div>

      {/* Modals */}
      {showEmailModal && (
        <EmailModal
          email={userData?.email}
          newEmail={newEmail}
          onEmailChange={handleEmailChange}
          onClose={closeEmailModal}
          onSubmit={handleUpdateEmail}
          isLoading={isUpdatingEmail}
        />
      )}

      {showPasswordModal && (
        <PasswordModal
          passwordData={passwordData}
          passwordErrors={passwordErrors}
          onPasswordChange={handlePasswordChange}
          onClose={closePasswordModal}
          onSubmit={handleUpdatePassword}
          isLoading={isUpdatingPassword}
        />
      )}

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          isLoading={isDeleting}
        />
      )}

      {showSuccessNotification && (
        <SuccessNotification
          message={successMessage}
          onClose={() => setShowSuccessNotification(false)}
        />
      )}
    </div>
  );
};

export default AccountSettings;
