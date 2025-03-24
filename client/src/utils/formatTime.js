import { formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";

const formatTime = (date) => {
  if (!date) return "Không xác định";
  try {
    const formattedRelative = formatDistanceToNowStrict(new Date(date), {
      addSuffix: true,
      locale: vi,
    });
    return formattedRelative.includes("dưới 1 phút trước")
      ? "Vừa xong"
      : formattedRelative;
  } catch (error) {
    console.error("Lỗi định dạng thời gian:", error);
    return "Không xác định";
  }
};

export default formatTime;
