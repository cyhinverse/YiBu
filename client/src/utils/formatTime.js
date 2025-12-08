import { formatDistanceToNow } from "./dateUtils";

const formatTime = (date) => {
  if (!date) return "Không xác định";
  try {
    const formattedRelative = formatDistanceToNow(new Date(date));
    return formattedRelative.includes("dưới 1 phút trước")
      ? "Vừa xong"
      : formattedRelative;
  } catch (error) {
    console.error("Lỗi định dạng thời gian:", error);
    return "Không xác định";
  }
};

export default formatTime;
