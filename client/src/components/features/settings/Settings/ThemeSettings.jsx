import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
// import UserSettingsService from "../../../services/userSettingsService";
import { getUserSettings, updateThemeSettings } from "../../../../redux/actions/userActions";
import { toast } from "react-hot-toast";
import { setThemeSettings } from "../../../../redux/slices/UserSlice";
import { Sun, Moon, Monitor, Save } from "lucide-react";

const ThemeSettings = () => {
  const dispatch = useDispatch();
  const userSettings = useSelector((state) => state.user?.settings);
  const theme = userSettings?.theme;

  const [loading, setLoading] = useState(false);
  const [themeData, setThemeData] = useState({
    appearance: "system",
    primaryColor: "#4f46e5",
    fontSize: "medium",
  });

  useEffect(() => {
    if (theme) {
      setThemeData(theme);
    }

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await dispatch(getUserSettings()).unwrap();
        if (
          response.success &&
          response.userSettings &&
          response.userSettings.theme
        ) {
          const serverTheme = response.userSettings.theme;
          setThemeData(serverTheme);
          dispatch(setThemeSettings(serverTheme));
        } else if (response.data && response.data.userSettings && response.data.userSettings.theme) {
          const serverTheme = response.data.userSettings.theme;
           setThemeData(serverTheme);
          dispatch(setThemeSettings(serverTheme));
        }
      } catch (error) {
        console.error("Lỗi khi lấy cài đặt:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!theme) {
      fetchSettings();
    }
  }, [dispatch]); // Removed theme from dependency to avoid loop if not handled carefully, or check if ok. Original had dispatch only but logic suggests theme check inside.

  useEffect(() => {
    applyThemeToDocument(themeData);
  }, [themeData]);

  useEffect(() => {
    console.log("ThemeSettings: Component mounted");
    console.log("ThemeSettings: Initial Redux theme state:", theme);
    console.log("ThemeSettings: Initial theme data state:", themeData);

    try {
      const persistedRoot = localStorage.getItem("persist:root");
      if (persistedRoot) {
        const parsedRoot = JSON.parse(persistedRoot);
        if (parsedRoot.user) {
          const userData = JSON.parse(parsedRoot.user);
          console.log(
            "ThemeSettings: Theme from localStorage:",
            userData?.settings?.theme
          );
        }
      }
    } catch (error) {
      console.error("ThemeSettings: Error parsing localStorage:", error);
    }
  }, []);

  const applyThemeToDocument = (theme) => {
    console.log("ThemeSettings: Applying theme to document", theme);

    if (theme.appearance === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else if (theme.appearance === "dark") {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else if (theme.appearance === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      document.documentElement.classList.remove(prefersDark ? "light" : "dark");
      document.documentElement.classList.add(prefersDark ? "dark" : "light");
    }

    document.documentElement.style.setProperty(
      "--primary-color",
      theme.primaryColor
    );

    let rootFontSize = "16px";
    if (theme.fontSize === "small") rootFontSize = "14px";
    if (theme.fontSize === "large") rootFontSize = "18px";
    document.documentElement.style.fontSize = rootFontSize;
  };

  const handleChange = (name, value) => {
    console.log(`Changing ${name} to ${value}`);

    const updatedTheme = {
      ...themeData,
      [name]: value,
    };
    console.log("Updated theme data:", updatedTheme);

    setThemeData(updatedTheme);

    dispatch(setThemeSettings(updatedTheme));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await dispatch(updateThemeSettings(themeData)).unwrap();

      if (response && (response.success || response.code === 1)) {
        toast.success("Cài đặt giao diện đã được lưu");
        dispatch(setThemeSettings(themeData));
      } else {
        toast.error("Không thể lưu cài đặt giao diện");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật giao diện:", error);
      toast.error("Lỗi khi lưu cài đặt: " + (error.message || "Đã xảy ra lỗi"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 space-y-10 ">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
        Cài Đặt Giao Diện
      </h1>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200">
          Chế Độ Hiển Thị
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            className={`p-4 rounded-md flex flex-col items-center justify-center transition-all ${
              themeData.appearance === "light"
                ? "border-blue-500 bg-blue-50  dark:bg-blue-900/50 text-gray-800 dark:text-white"
                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
            onClick={() => handleChange("appearance", "light")}
          >
            <Sun className="w-6 h-6 mb-2 text-yellow-500 dark:text-yellow-400" />
            <span>Sáng</span>
          </button>
          <button
            type="button"
            className={`p-4 rounded-md flex flex-col items-center justify-center border transition-all ${
              themeData.appearance === "dark"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/50 text-black dark:text-white"
                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
            onClick={() => handleChange("appearance", "dark")}
          >
            <Moon className="w-6 h-6 mb-2 text-indigo-400 dark:text-indigo-300" />
            <span>Tối</span>
          </button>
          <button
            type="button"
            className={`p-4 rounded-md flex flex-col items-center justify-center border transition-all ${
              themeData.appearance === "system"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/50 text-gray-800 dark:text-white"
                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
            onClick={() => handleChange("appearance", "system")}
          >
            <Monitor className="w-6 h-6 mb-2 text-gray-500 dark:text-gray-400" />
            <span>Hệ thống</span>
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200">
          Màu Chủ Đạo
        </h2>
        <div className="grid grid-cols-5 gap-3">
          {["#4f46e5", "#7c3aed", "#db2777", "#ea580c", "#16a34a"].map(
            (color) => (
              <button
                key={color}
                type="button"
                className={`w-12 h-12 rounded-full transition-all ${
                  themeData.primaryColor === color
                    ? "ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400 dark:ring-offset-gray-800"
                    : "hover:scale-110"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  console.log(`Selecting color: ${color}`);
                  handleChange("primaryColor", color);
                }}
                aria-label={`Select color ${color}`}
              ></button>
            )
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200">
          Cỡ Chữ
        </h2>
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
            <span>Nhỏ</span>
            <span>Vừa</span>
            <span>Lớn</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            value={
              themeData.fontSize === "small"
                ? 1
                : themeData.fontSize === "medium"
                ? 2
                : 3
            }
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              const fontSize =
                value === 1 ? "small" : value === 2 ? "medium" : "large";
              handleChange("fontSize", fontSize);
            }}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
          />
          <div className="text-center text-sm mt-2 text-gray-600 dark:text-gray-300">
            Kích thước hiện tại:
            <span className="font-medium ml-1">
              {themeData.fontSize === "small"
                ? "Nhỏ"
                : themeData.fontSize === "medium"
                ? "Vừa"
                : "Lớn"}
            </span>
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <button
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Lưu Thay Đổi</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ThemeSettings;
