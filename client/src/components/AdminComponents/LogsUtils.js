import { DATE_FORMAT_OPTIONS, CSV_HEADERS } from "./LogsConfig";

/**
 * Định dạng ngày tháng
 * @param {string} dateString - Chuỗi ngày tháng cần định dạng
 * @returns {string} Chuỗi ngày tháng đã định dạng
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", DATE_FORMAT_OPTIONS).format(date);
};

/**
 * Xuất dữ liệu log ra file CSV
 * @param {Array} logs - Mảng dữ liệu log cần xuất
 */
export const exportLogsToCSV = (logs) => {
  if (!logs || logs.length === 0) return;

  const csvRows = [];

  // Thêm header
  csvRows.push(CSV_HEADERS.join(","));

  // Thêm dữ liệu
  logs.forEach((log) => {
    const row = [
      `"${log.action || ""}"`,
      `"${log.level || ""}"`,
      `"${log.module || ""}"`,
      `"${log.details?.replace(/"/g, '""') || ""}"`,
      `"${log.user?.username || ""}"`,
      `"${log.ip || ""}"`,
      `"${formatDate(log.createdAt) || ""}"`,
    ];
    csvRows.push(row.join(","));
  });

  // Tạo file và download
  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `system_logs_${new Date().toISOString().slice(0, 10)}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Xây dựng bộ lọc từ state của component
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @param {string} filterLevel - Level filter
 * @param {string} filterModule - Module filter
 * @param {Object} filterDateRange - Khoảng thời gian filter
 * @returns {Object} Đối tượng chứa các tham số lọc
 */
export const buildFilterParams = (
  searchTerm,
  filterLevel,
  filterModule,
  filterDateRange
) => {
  const filters = {};

  if (filterLevel) filters.level = filterLevel;
  if (filterModule) filters.module = filterModule;
  if (searchTerm) filters.action = searchTerm;

  if (filterDateRange.startDate) {
    filters.startDate = filterDateRange.startDate;
  }

  if (filterDateRange.endDate) {
    filters.endDate = filterDateRange.endDate;
  }

  return filters;
};
