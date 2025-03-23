import React, { useState, useEffect } from "react";
import UserSettingsService from "../../../services/userSettingsService";
import { toast } from "react-toastify";

const ThemeSettings = () => {
  const [loading, setLoading] = useState(false);
  const [themeData, setThemeData] = useState({
    appearance: "system",
    primaryColor: "#4f46e5",
    fontSize: "medium",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await UserSettingsService.getAllSettings();
        if (response.success && response.userSettings && response.userSettings.theme) {
          setThemeData(response.userSettings.theme);
        }
      } catch (error) {
        console.error("Lỗi khi lấy cài đặt:", error);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setThemeData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await UserSettingsService.updateThemeSettings(themeData);
      toast.success("Cài đặt giao diện đã được lưu");
    } catch (error) {
      console.error("Lỗi khi cập nhật giao diện:", error);
      toast.error("Lỗi khi lưu cài đặt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 space-y-10 bg-neutral-50 border border-neutral-200 rounded-xl">
      <h1 className="text-2xl font-semibold text-neutral-800">Cài Đặt Giao Diện</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">Chế Độ Hiển Thị</h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            className={`p-4 rounded-md flex flex-col items-center justify-center border ${
              themeData.appearance === "light"
                ? "border-blue-500 bg-blue-50"
                : "border-neutral-300 bg-white"
            }`}
            onClick={() => setThemeData(prev => ({ ...prev, appearance: "light" }))}
          >
            <span className="material-icons-outlined text-3xl mb-2">light_mode</span>
            <span>Sáng</span>
          </button>
          <button
            className={`p-4 rounded-md flex flex-col items-center justify-center border ${
              themeData.appearance === "dark"
                ? "border-blue-500 bg-blue-50"
                : "border-neutral-300 bg-white"
            }`}
            onClick={() => setThemeData(prev => ({ ...prev, appearance: "dark" }))}
          >
            <span className="material-icons-outlined text-3xl mb-2">dark_mode</span>
            <span>Tối</span>
          </button>
          <button
            className={`p-4 rounded-md flex flex-col items-center justify-center border ${
              themeData.appearance === "system"
                ? "border-blue-500 bg-blue-50"
                : "border-neutral-300 bg-white"
            }`}
            onClick={() => setThemeData(prev => ({ ...prev, appearance: "system" }))}
          >
            <span className="material-icons-outlined text-3xl mb-2">devices</span>
            <span>Hệ thống</span>
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">Màu Chủ Đạo</h2>
        <div className="grid grid-cols-5 gap-3">
          {["#4f46e5", "#7c3aed", "#db2777", "#ea580c", "#16a34a"].map((color) => (
            <button
              key={color}
              className={`w-12 h-12 rounded-full ${
                themeData.primaryColor === color ? "ring-2 ring-offset-2 ring-blue-500" : ""
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setThemeData(prev => ({ ...prev, primaryColor: color }))}
            ></button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">Cỡ Chữ</h2>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            name="fontSize"
            min="1"
            max="3"
            value={
              themeData.fontSize === "small" ? 1 : themeData.fontSize === "medium" ? 2 : 3
            }
            onChange={(e) => {
              const value = e.target.value;
              const fontSize = value === "1" ? "small" : value === "2" ? "medium" : "large";
              setThemeData(prev => ({ ...prev, fontSize }));
            }}
            className="w-full"
          />
          <span className="text-xs">
            {themeData.fontSize === "small"
              ? "Nhỏ"
              : themeData.fontSize === "medium"
              ? "Vừa"
              : "Lớn"}
          </span>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <button
          className="px-6 py-2 bg-neutral-800 text-white rounded-md hover:bg-neutral-900 transition disabled:opacity-50"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Đang lưu..." : "Lưu Thay Đổi"}
        </button>
      </div>
    </div>
  );
};

export default ThemeSettings;
