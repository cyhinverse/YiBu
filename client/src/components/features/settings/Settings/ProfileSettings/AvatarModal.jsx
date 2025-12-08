import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { updateProfileSettings } from "../../../../../redux/actions/userActions";

const AvatarModal = ({ isOpen, closeModal, currentAvatar, onAvatarChange }) => {
  const dispatch = useDispatch();
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentAvatar || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarInfo, setAvatarInfo] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log("Không có file được chọn");
      return;
    }

    console.log("File đã chọn:", file);
    console.log("File type:", file.type);
    console.log("File size:", file.size);

    setErrorMessage("");

    // Kiểm tra xem file có phải là hình ảnh không
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh!");
      setErrorMessage("Vui lòng chọn file hình ảnh");
      return;
    }

    // Kiểm tra kích thước file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const errorMsg = `Kích thước file (${sizeMB}MB) vượt quá 10MB!`;
      toast.error(errorMsg);
      setErrorMessage(errorMsg);
      return;
    }

    // Hiển thị thông tin file đã chọn
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    setAvatarInfo(`Ảnh ${file.name} (${sizeMB}MB)`);
    setSelectedImage(file);

    // Tạo URL xem trước
    try {
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        const result = event.target.result;
        console.log("FileReader đã tạo preview URL");
        setPreviewUrl(result);
        console.log("Độ dài previewUrl:", result ? result.length : 0);
        console.log(
          "Preview URL (đầu):",
          result ? result.substring(0, 50) : "null"
        );
      };

      fileReader.onerror = (error) => {
        console.error("Lỗi khi đọc file:", error);
        toast.error("Có lỗi khi hiển thị ảnh xem trước");
        setErrorMessage("Không thể đọc file. Vui lòng thử lại với file khác.");
      };

      fileReader.readAsDataURL(file);
    } catch (error) {
      console.error("Exception khi xử lý file:", error);
      setErrorMessage("Lỗi khi xử lý file. Vui lòng thử lại.");
    }
  };

  // Effect để kiểm tra previewUrl
  useEffect(() => {
    console.log(
      "previewUrl đã thay đổi:",
      previewUrl ? "Có giá trị" : "Không có giá trị"
    );
  }, [previewUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      toast.error("Vui lòng chọn ảnh trước khi cập nhật");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("avatar", selectedImage);
      // Thêm thông tin avatar vào form data nếu có
      if (avatarInfo.trim()) {
        formData.append("avatarInfo", avatarInfo);
      }

      console.log("Gửi request cập nhật ảnh đại diện");
      toast.loading("Đang tải ảnh lên Cloudinary...", { id: "avatarUpload" });
      
      const response = await dispatch(updateProfileSettings(formData)).unwrap();
      console.log("Kết quả cập nhật avatar:", response);

      if (response.success || response.code === 1) {
        toast.success("Cập nhật avatar thành công!", { id: "avatarUpload" });
        
        // Find avatar url in response structure
        let newAvatarUrl = null;
        if (response.userData && response.userData.avatar) {
          newAvatarUrl = response.userData.avatar;
        } else if (response.data && response.data.userData && response.data.userData.avatar) {
          newAvatarUrl = response.data.userData.avatar;
        } else if (response.data && response.data.avatar) {
           newAvatarUrl = response.data.avatar; 
        }

        if (newAvatarUrl) {
          console.log("Avatar mới:", newAvatarUrl);
          onAvatarChange(newAvatarUrl);
        } else {
          console.warn("Không có URL avatar mới trong response");
          // Có thể sử dụng URL từ previewUrl nếu server không trả về
          onAvatarChange(previewUrl);
        }
        closeModal();
      } else {
        toast.error(response.message || "Cập nhật avatar thất bại!", { id: "avatarUpload" });
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật avatar:", error);
      toast.error(error.message || "Đã xảy ra lỗi khi cập nhật avatar!", { id: "avatarUpload" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const preventClickPropagation = (e) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/10 bg-opacity-50 flex items-center justify-center z-50"
      onClick={closeModal}
    >
      <form
        className="bg-white p-6 rounded-lg w-96 max-w-md"
        onClick={preventClickPropagation}
        onSubmit={handleSubmit}
      >
        <h3 className="text-xl font-semibold mb-4">Cập nhật ảnh đại diện</h3>

        <div className="flex flex-col items-center mb-4">
          <div className="w-40 h-40 rounded-full overflow-hidden mb-4 border-2 border-gray-200">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Avatar Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Lỗi khi tải ảnh preview");
                  e.target.src = "https://via.placeholder.com/150";
                  setErrorMessage("Không thể hiển thị ảnh xem trước");
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <span className="text-gray-400">Avatar Preview</span>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="text-red-500 text-sm mb-2">{errorMessage}</div>
          )}

          <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md">
            Chọn ảnh
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="avatarInfo"
          >
            Thông tin ảnh
          </label>
          <input
            id="avatarInfo"
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Nhập thông tin về ảnh đại diện"
            value={avatarInfo}
            onChange={(e) => setAvatarInfo(e.target.value)}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            onClick={closeModal}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
            disabled={!selectedImage || isSubmitting}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AvatarModal;
