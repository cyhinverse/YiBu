// Format lại ngày sinh để hiển thị trong input date
export const formatDateForInput = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ""; // Invalid date

    return date.toISOString().split("T")[0]; // Format YYYY-MM-DD
  } catch (error) {
    console.error("Lỗi khi format ngày:", error);
    return "";
  }
};

// Format lại ngày sinh để hiển thị cho người dùng
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return "Chưa cập nhật";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Chưa cập nhật"; // Invalid date

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    console.error("Lỗi khi format ngày:", error);
    return "Chưa cập nhật";
  }
};

// Chuyển đổi giá trị gender thành text hiển thị
export const getGenderText = (gender) => {
  switch (gender) {
    case "male":
      return "Nam";
    case "female":
      return "Nữ";
    case "other":
      return "Khác";
    default:
      return "Chưa cập nhật";
  }
};
