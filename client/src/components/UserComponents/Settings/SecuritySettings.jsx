import React, { useState, useEffect } from "react";
import UserSettingsService from "../../../services/userSettingsService";
import { toast } from "react-toastify";

const SecuritySettings = () => {
  const [loading, setLoading] = useState(false);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [securityData, setSecurityData] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    securityQuestion: "",
  });
  const [trustedDevices, setTrustedDevices] = useState([]);

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
        response.userSettings.security
      ) {
        setSecurityData(response.userSettings.security);
        if (response.userSettings.security.trustedDevices) {
          setTrustedDevices(response.userSettings.security.trustedDevices);
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy cài đặt bảo mật:", error);
      toast.error("Không thể tải cài đặt bảo mật");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecurityData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveSecurity = async () => {
    try {
      setLoading(true);
      await UserSettingsService.updateSecuritySettings(securityData);
      toast.success("Cài đặt bảo mật đã được lưu");
    } catch (error) {
      console.error("Lỗi khi cập nhật bảo mật:", error);
      toast.error("Lỗi khi lưu cài đặt");
    } finally {
      setLoading(false);
    }
  };

  const toggleTwoFactor = async () => {
    try {
      setLoading(true);
      const newValue = !securityData.twoFactorEnabled;

      await UserSettingsService.updateSecuritySettings({
        ...securityData,
        twoFactorEnabled: newValue,
      });

      setSecurityData((prev) => ({
        ...prev,
        twoFactorEnabled: newValue,
      }));

      toast.success(
        newValue ? "Đã bật xác thực hai yếu tố" : "Đã tắt xác thực hai yếu tố"
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật 2FA:", error);
      toast.error("Lỗi khi thay đổi trạng thái 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    try {
      setDeviceLoading(true);
      await UserSettingsService.removeTrustedDevice(deviceId);
      setTrustedDevices((prev) =>
        prev.filter((device) => device.id !== deviceId)
      );
      toast.success("Đã xóa thiết bị khỏi danh sách tin cậy");
    } catch (error) {
      console.error("Lỗi khi xóa thiết bị:", error);
      toast.error("Không thể xóa thiết bị");
    } finally {
      setDeviceLoading(false);
    }
  };

  const handleRemoveAllDevices = async () => {
    try {
      setDeviceLoading(true);

      // Giả sử API hỗ trợ xóa nhiều thiết bị cùng lúc
      // Nếu không, có thể cần phải gọi API nhiều lần
      const promises = trustedDevices.map((device) =>
        UserSettingsService.removeTrustedDevice(device.id)
      );

      await Promise.all(promises);
      setTrustedDevices([]);
      toast.success("Đã xóa tất cả thiết bị");
    } catch (error) {
      console.error("Lỗi khi xóa tất cả thiết bị:", error);
      toast.error("Không thể xóa tất cả thiết bị");
    } finally {
      setDeviceLoading(false);
    }
  };

  const formatLastActive = (date) => {
    if (!date) return "Không rõ";

    const lastActive = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - lastActive);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 space-y-10 bg-neutral-50 border border-neutral-200 rounded-xl">
      <h1 className="text-2xl font-semibold text-neutral-800">
        Cài Đặt Bảo Mật
      </h1>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Xác Thực Hai Yếu Tố (2FA)
        </h2>
        <p className="text-sm text-neutral-500">
          Thêm một lớp bảo mật bổ sung cho tài khoản của bạn bằng cách bật 2FA.
        </p>
        <div className="flex justify-end">
          <button
            className={`px-5 py-2 ${
              securityData.twoFactorEnabled
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white rounded-md text-sm transition disabled:opacity-50`}
            onClick={toggleTwoFactor}
            disabled={loading}
          >
            {loading
              ? "Đang xử lý..."
              : securityData.twoFactorEnabled
              ? "Tắt 2FA"
              : "Bật 2FA"}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Cảnh Báo Đăng Nhập
        </h2>
        <p className="text-sm text-neutral-500">
          Nhận thông báo khi chúng tôi phát hiện một đăng nhập mới vào tài khoản
          của bạn.
        </p>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="loginAlerts"
            checked={securityData.loginAlerts}
            onChange={handleChange}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-neutral-700">
            Gửi email cho tôi về các đăng nhập mới
          </span>
        </label>
        <div className="flex justify-end">
          <button
            className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition disabled:opacity-50"
            onClick={handleSaveSecurity}
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Thiết Bị Đáng Tin Cậy
        </h2>
        <p className="text-sm text-neutral-500">
          Quản lý các thiết bị mà bạn tin tưởng và đã đăng nhập từ đó.
        </p>
        {deviceLoading ? (
          <p className="text-sm text-neutral-500">Đang tải thiết bị...</p>
        ) : trustedDevices.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Không có thiết bị đáng tin cậy nào
          </p>
        ) : (
          <ul className="text-sm text-neutral-700 space-y-2">
            {trustedDevices.map((device) => (
              <li key={device.id} className="flex justify-between items-center">
                <span>
                  • {device.name} - Hoạt động lần cuối:{" "}
                  {formatLastActive(device.lastActive)}
                </span>
                <button
                  className="text-xs text-red-600 hover:text-red-700"
                  onClick={() => handleRemoveDevice(device.id)}
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        )}
        {trustedDevices.length > 0 && (
          <div className="flex justify-end">
            <button
              className="px-5 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition disabled:opacity-50"
              onClick={handleRemoveAllDevices}
              disabled={deviceLoading}
            >
              {deviceLoading ? "Đang xử lý..." : "Xóa Tất Cả Thiết Bị"}
            </button>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Câu Hỏi Bảo Mật
        </h2>
        <p className="text-sm text-neutral-500">
          Cập nhật câu hỏi bảo mật của bạn để khôi phục tài khoản.
        </p>
        <input
          type="text"
          name="securityQuestion"
          value={securityData.securityQuestion}
          onChange={handleChange}
          placeholder="Tên giáo viên thời thơ ấu yêu thích của bạn"
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <div className="flex justify-end">
          <button
            className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition disabled:opacity-50"
            onClick={handleSaveSecurity}
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default SecuritySettings;
