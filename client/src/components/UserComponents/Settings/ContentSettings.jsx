import React, { useState, useEffect } from "react";
import UserSettingsService from "../../../services/userSettingsService";
import { toast } from "react-toastify";

const ContentSettings = () => {
  const [loading, setLoading] = useState(false);
  const [contentData, setContentData] = useState({
    language: "vi",
    showSensitiveContent: false,
    showUnverifiedContent: true,
    autoplayVideos: "always",
    contentFilters: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await UserSettingsService.getAllSettings();
      if (
        response.success &&
        response.userSettings &&
        response.userSettings.content
      ) {
        setContentData(response.userSettings.content);
      }
    } catch (error) {
      console.error("Lỗi khi lấy cài đặt nội dung:", error);
      toast.error("Không thể tải cài đặt nội dung");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setContentData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveContent = async () => {
    try {
      setLoading(true);
      await UserSettingsService.updateContentSettings(contentData);
      toast.success("Cài đặt nội dung đã được lưu");
    } catch (error) {
      console.error("Lỗi khi cập nhật nội dung:", error);
      toast.error("Lỗi khi lưu cài đặt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 space-y-10 bg-neutral-50 border border-neutral-200 rounded-xl">
      <h1 className="text-2xl font-semibold text-neutral-800">
        Cài Đặt Nội Dung
      </h1>

      {/* Language Preferences */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Tùy Chọn Ngôn Ngữ
        </h2>
        <select
          name="language"
          value={contentData.language}
          onChange={handleChange}
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="en">Tiếng Anh</option>
          <option value="vi">Tiếng Việt</option>
          <option value="ja">Tiếng Nhật</option>
          <option value="ko">Tiếng Hàn</option>
        </select>
        <div className="flex justify-end">
          <button
            className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition disabled:opacity-50"
            onClick={handleSaveContent}
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </section>

      {/* Content Visibility */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Hiển Thị Nội Dung
        </h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="showSensitiveContent"
            checked={contentData.showSensitiveContent}
            onChange={handleChange}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-neutral-700">
            Hiển thị nội dung nhạy cảm
          </span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="showUnverifiedContent"
            checked={contentData.showUnverifiedContent}
            onChange={handleChange}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-neutral-700">
            Hiển thị nội dung từ tài khoản chưa xác minh
          </span>
        </label>
        <div className="flex justify-end">
          <button
            className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition disabled:opacity-50"
            onClick={handleSaveContent}
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </section>

      {/* Autoplay Settings */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Tự Động Phát Video
        </h2>
        <select
          name="autoplayVideos"
          value={contentData.autoplayVideos}
          onChange={handleChange}
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="always">Luôn tự động phát</option>
          <option value="wifi">Chỉ tự động phát khi dùng Wi-Fi</option>
          <option value="never">Không bao giờ tự động phát</option>
        </select>
        <div className="flex justify-end">
          <button
            className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition disabled:opacity-50"
            onClick={handleSaveContent}
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </section>

      {/* Content Filters */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Bộ Lọc Nội Dung
        </h2>
        <input
          type="text"
          name="contentFilters"
          value={contentData.contentFilters}
          onChange={handleChange}
          placeholder="Nhập từ khóa để lọc (phân cách bằng dấu phẩy)"
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <div className="flex justify-end">
          <button
            className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition disabled:opacity-50"
            onClick={handleSaveContent}
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ContentSettings;
