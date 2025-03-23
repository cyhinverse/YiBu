import React, { useState, useEffect } from "react";
import UserSettingsService from "../../../services/userSettingsService";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { login } from "../../../slices/AuthSlice";
import {
  GenderBirthdayModal,
  InterestsModal,
  DefaultModal,
  ProfileSection,
  SuccessNotification,
  LoadingSkeleton,
  AvatarModal,
} from "./ProfileSettings/index";
import { formatDateForDisplay, getGenderText } from "./ProfileSettings/utils";
import { Camera } from "lucide-react";

// Component chính
const ProfileSettings = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    birthday: "",
    gender: "",
    interests: "",
    website: "",
    avatar: "",
    avatarInfo: "",
  });

  // State cho modal
  const [showModal, setShowModal] = useState(false);
  const [modalField, setModalField] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  // State cho thông báo thành công
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // State tạm để lưu dữ liệu đang chỉnh sửa
  const [tempData, setTempData] = useState({});

  // Lấy dữ liệu user từ Redux store
  const userData = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setInitialLoading(true);

        // Object để thu thập tất cả dữ liệu từ các nguồn
        let collectedData = {
          name: "",
          bio: "",
          birthday: "",
          gender: "",
          interests: "",
          website: "",
          avatar: "",
          avatarInfo: "",
        };

        // Thử lấy từ API
        const response = await UserSettingsService.getAllSettings();

        // Dữ liệu từ API settings
        if (
          response.success &&
          response.userSettings &&
          response.userSettings.profile
        ) {
          const profile = response.userSettings.profile;
          collectedData = { ...collectedData, ...profile };
        }

        // Kiểm tra cấu trúc dữ liệu userData
        let userDataObj = userData;

        // Nếu userData có cấu trúc { user: {...} }, lấy phần user
        if (userData && userData.user) {
          userDataObj = userData.user;
        }

        if (userDataObj) {
          collectedData = {
            ...collectedData,
            name: userDataObj.name || collectedData.name,
            bio: userDataObj.bio || collectedData.bio,
            gender: userDataObj.gender || collectedData.gender,
            birthday: userDataObj.birthday || collectedData.birthday,
            website: userDataObj.website || collectedData.website,
            interests: userDataObj.interests || collectedData.interests,
            avatar: userDataObj.avatar || collectedData.avatar,
            avatarInfo: userDataObj.avatarInfo || collectedData.avatarInfo,
          };
        }

        // Nếu không có dữ liệu từ API và Redux, thử lấy từ localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            collectedData = {
              ...collectedData,
              name: parsedUser.name || collectedData.name,
              bio: parsedUser.bio || collectedData.bio,
              gender: parsedUser.gender || collectedData.gender,
              birthday: parsedUser.birthday || collectedData.birthday,
              website: parsedUser.website || collectedData.website,
              interests: parsedUser.interests || collectedData.interests,
              avatar: parsedUser.avatar || collectedData.avatar,
              avatarInfo: parsedUser.avatarInfo || collectedData.avatarInfo,
            };
          } catch (error) {
            console.error("Lỗi khi đọc dữ liệu từ localStorage:", error);
          }
        }

        // Kiểm tra nếu dữ liệu còn trống, dùng dữ liệu mẫu để test
        const isDataEmpty = Object.values(collectedData).every(
          (val) => !val || val === ""
        );

        if (isDataEmpty) {
          const testData = {
            name: "Nguyễn Văn A",
            bio: "Đây là bio mẫu để test giao diện, bạn có thể thay đổi nội dung này.",
            gender: "male",
            birthday: "1990-01-01",
            website: "https://example.com",
            interests: "Lập trình, Đọc sách, Du lịch, Âm nhạc",
            avatar: "https://via.placeholder.com/150",
            avatarInfo: "",
          };
          collectedData = testData;
        }

        // Set tất cả dữ liệu đã thu thập vào state một lần duy nhất
        setProfileData(collectedData);
      } catch (error) {
        console.error("Lỗi khi lấy cài đặt:", error);
        toast.error("Không thể tải thông tin hồ sơ");

        // Nếu có lỗi, vẫn set dữ liệu mẫu để UI không trống
        const testData = {
          name: "Nguyễn Văn A",
          bio: "Đây là bio mẫu để test giao diện, bạn có thể thay đổi nội dung này.",
          gender: "male",
          birthday: "1990-01-01",
          website: "https://example.com",
          interests: "Lập trình, Đọc sách, Du lịch, Âm nhạc",
          avatar: "https://via.placeholder.com/150",
          avatarInfo: "",
        };
        setProfileData(testData);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchSettings();
  }, [userData]);

  // Bắt đầu chỉnh sửa một phần với modal
  const handleEdit = (field) => {
    // Lưu dữ liệu hiện tại vào state tạm
    let fieldData = {};

    if (field === "genderBirthday") {
      fieldData = {
        gender: profileData.gender || "",
        birthday: profileData.birthday || "",
      };
    } else if (field === "avatar") {
      fieldData = {
        avatar: profileData.avatar || "",
      };
    } else {
      fieldData = profileData[field] || "";
    }

    console.log(`Chỉnh sửa trường ${field}:`, fieldData);
    console.log("Dữ liệu hiện tại:", profileData);

    setTempData({
      ...tempData,
      [field]: fieldData,
    });

    // Xác định tiêu đề modal
    let title = "";
    switch (field) {
      case "name":
        title = "Cập nhật tên";
        break;
      case "bio":
        title = "Cập nhật tiểu sử";
        break;
      case "website":
        title = "Cập nhật website";
        break;
      case "genderBirthday":
        title = "Cập nhật giới tính & ngày sinh";
        break;
      case "interests":
        title = "Cập nhật sở thích";
        break;
      case "avatar":
        title = "Thay đổi ảnh đại diện";
        break;
      default:
        title = "Cập nhật thông tin";
    }

    setModalTitle(title);
    setModalField(field);

    // Mở modal
    setShowModal(true);
  };

  // Hủy chỉnh sửa và đóng modal
  const handleCancel = () => {
    setShowModal(false);

    // Xóa dữ liệu tạm
    const newTempData = { ...tempData };
    delete newTempData[modalField];
    setTempData(newTempData);
  };

  // Hàm hiển thị thông báo thành công
  const showSuccessToast = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  // Hàm hiển thị thông báo lỗi
  const showErrorToast = (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  // Truyền trực tiếp dữ liệu để cập nhật, không phụ thuộc vào state
  const submitData = async (dataToUpdate) => {
    try {
      setIsSubmitting(true);

      console.log("Dữ liệu sẽ cập nhật (trực tiếp):", dataToUpdate);

      const response = await UserSettingsService.updateProfileSettings(
        dataToUpdate
      );

      console.log("Phản hồi từ server:", response);

      if (response.success) {
        // Cập nhật dữ liệu chính
        setProfileData((prev) => ({
          ...prev,
          ...dataToUpdate,
        }));

        // Cập nhật Redux và localStorage nếu cần
        if (response.userData) {
          // Lấy user hiện tại từ localStorage
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);

              // Cập nhật tất cả dữ liệu với thông tin mới từ server
              const updatedUser = {
                ...parsedUser,
                ...response.userData,
              };

              console.log("Cập nhật dữ liệu user:", updatedUser);

              // Lưu lại vào localStorage
              localStorage.setItem("user", JSON.stringify(updatedUser));

              // Cập nhật Redux store
              dispatch(login(updatedUser));
            } catch (error) {
              console.error("Lỗi khi cập nhật localStorage:", error);
            }
          }
        }

        // Đóng modal
        setShowModal(false);

        // Xóa dữ liệu tạm
        const newTempData = { ...tempData };
        delete newTempData[modalField];
        setTempData(newTempData);

        // Hiển thị thông báo thành công
        let successMsg = "";
        if (modalField === "name") {
          successMsg = "Cập nhật tên người dùng thành công";
        } else if (modalField === "bio") {
          successMsg = "Cập nhật tiểu sử thành công";
        } else if (modalField === "website") {
          successMsg = "Cập nhật website thành công";
        } else if (modalField === "genderBirthday") {
          successMsg = "Cập nhật thông tin cá nhân thành công";
        } else if (modalField === "interests") {
          successMsg = "Cập nhật sở thích thành công";
        } else if (modalField === "avatar") {
          successMsg = "Cập nhật ảnh đại diện thành công";
        }

        setSuccessMessage(successMsg);
        setShowSuccess(true);

        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);

        // Hiển thị toast thành công
        showSuccessToast("Cập nhật thành công");
      } else {
        // Hiển thị toast lỗi
        showErrorToast(response.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      // Hiển thị toast lỗi
      showErrorToast("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal Component
  const UpdateModal = () => {
    if (!showModal) return null;

    // Modal cho trường genderBirthday
    if (modalField === "genderBirthday") {
      return (
        <GenderBirthdayModal
          title={modalTitle}
          tempData={tempData.genderBirthday || {}}
          handleCancel={handleCancel}
          handleSubmit={submitData}
        />
      );
    }

    // Modal cho trường interests
    if (modalField === "interests") {
      return (
        <InterestsModal
          title={modalTitle}
          tempData={{ interests: tempData.interests }}
          handleCancel={handleCancel}
          handleSubmit={submitData}
        />
      );
    }

    // Modal cho avatar
    if (modalField === "avatar") {
      return (
        <AvatarModal
          isOpen={showModal}
          closeModal={handleCancel}
          currentAvatar={profileData.avatar}
          onAvatarChange={(newAvatarUrl) => {
            // Lấy thông tin avatar từ modal và cập nhật cả avatar và avatarInfo
            submitData({
              avatar: newAvatarUrl,
              // Nếu có avatarInfo từ form, sẽ được gửi từ AvatarModal
            });
          }}
        />
      );
    }

    // Default modal for other fields (bio, website, name)
    const modalTempData = {
      bio: modalField === "bio" ? tempData.bio : "",
      website: modalField === "website" ? tempData.website : "",
      name: modalField === "name" ? tempData.name : "",
    };

    return (
      <DefaultModal
        title={modalTitle}
        tempData={modalTempData}
        handleCancel={handleCancel}
        handleSubmit={submitData}
        modalField={modalField}
      />
    );
  };

  // Hiển thị skeleton loading khi đang tải dữ liệu ban đầu
  if (initialLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-purple-700">
          Cài Đặt Hồ Sơ Cá Nhân
        </h1>

        <div className="space-y-6">
          {/* Ảnh đại diện */}
          <div className="bg-gray-50 p-6 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                  <img
                    src={
                      profileData.avatar || "https://via.placeholder.com/150"
                    }
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => handleEdit("avatar")}
                  className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-1.5"
                  disabled={isSubmitting}
                >
                  <Camera size={16} />
                </button>
              </div>
              <div className="ml-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  Ảnh đại diện
                </h3>
                {profileData.avatarInfo ? (
                  <p className="text-sm text-gray-600">
                    {profileData.avatarInfo}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Tải lên ảnh đại diện của bạn
                  </p>
                )}
              </div>
            </div>
            <button
              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              onClick={() => handleEdit("avatar")}
              disabled={isSubmitting}
            >
              Thay đổi
            </button>
          </div>

          {/* Tên */}
          <ProfileSection
            title="Tên hiển thị"
            content={
              <p className="text-gray-700">
                {profileData.name || "Chưa cập nhật"}
              </p>
            }
            editField="name"
            onEdit={handleEdit}
            isDisabled={isSubmitting}
          />

          {/* Tiểu sử */}
          <ProfileSection
            title="Tiểu sử"
            content={
              <p className="text-gray-700 whitespace-pre-line">
                {profileData.bio || "Chưa cập nhật"}
              </p>
            }
            editField="bio"
            onEdit={handleEdit}
            isDisabled={isSubmitting}
          />

          {/* Website */}
          <ProfileSection
            title="Website"
            content={
              <p className="text-gray-700">
                {profileData.website ? (
                  <a
                    href={profileData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {profileData.website}
                  </a>
                ) : (
                  "Chưa cập nhật"
                )}
              </p>
            }
            editField="website"
            onEdit={handleEdit}
            isDisabled={isSubmitting}
          />

          {/* Giới tính & Ngày sinh */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-800">
                Giới tính & Ngày sinh
              </h3>
              <button
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                onClick={() => handleEdit("genderBirthday")}
                disabled={isSubmitting}
              >
                Chỉnh sửa
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Giới tính</p>
                <p className="text-gray-700">
                  {getGenderText(profileData.gender)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Ngày sinh</p>
                <p className="text-gray-700">
                  {formatDateForDisplay(profileData.birthday)}
                </p>
              </div>
            </div>
          </div>

          {/* Sở thích */}
          <ProfileSection
            title="Sở thích"
            content={
              <p className="text-gray-700 whitespace-pre-line">
                {profileData.interests || "Chưa cập nhật"}
              </p>
            }
            editField="interests"
            onEdit={handleEdit}
            isDisabled={isSubmitting}
          />
        </div>
      </div>

      {/* Modal for editing */}
      <UpdateModal />

      {/* Success notification */}
      <SuccessNotification show={showSuccess} message={successMessage} />
    </>
  );
};

export default ProfileSettings;
