// Cấu hình cho các level trong logs
export const LOG_LEVELS = [
  { value: "", label: "Tất cả mức độ" },
  { value: "info", label: "Thông tin" },
  { value: "warning", label: "Cảnh báo" },
  { value: "error", label: "Lỗi" },
  { value: "critical", label: "Nghiêm trọng" },
];

// Cấu hình cho các module trong logs
export const LOG_MODULES = [
  { value: "", label: "Tất cả module" },
  { value: "auth", label: "Xác thực" },
  { value: "user", label: "Người dùng" },
  { value: "post", label: "Bài viết" },
  { value: "comment", label: "Bình luận" },
  { value: "admin", label: "Quản trị" },
  { value: "system", label: "Hệ thống" },
];

// Hàm lấy màu cho badge dựa trên level
export const getLevelBadgeColor = (level) => {
  switch (level) {
    case "error":
      return "bg-red-100 text-red-800";
    case "warning":
      return "bg-yellow-100 text-yellow-800";
    case "critical":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
};

// Header cho export CSV
export const CSV_HEADERS = [
  "Action",
  "Level",
  "Module",
  "Details",
  "User",
  "IP",
  "Timestamp",
];

// Cấu hình định dạng ngày tháng
export const DATE_FORMAT_OPTIONS = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

// Số mục trên mỗi trang
export const ITEMS_PER_PAGE = 10;

// Thời gian debounce cho tìm kiếm (ms)
export const SEARCH_DEBOUNCE_TIME = 500;
