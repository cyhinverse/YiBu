import React, { useState, useEffect } from "react";
import UserSettingsService from "../../../services/userSettingsService";
import { toast } from "react-toastify";

const PrivacySettings = () => {
  const [loading, setLoading] = useState(false);
  const [blockListLoading, setBlockListLoading] = useState(false);
  const [privacyData, setPrivacyData] = useState({
    profileVisibility: "public",
    searchable: true,
    dataSharing: true,
  });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [newBlockUser, setNewBlockUser] = useState("");

  useEffect(() => {
    fetchSettings();
    fetchBlockList();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await UserSettingsService.getAllSettings();
      if (
        response.success &&
        response.userSettings &&
        response.userSettings.privacy
      ) {
        setPrivacyData(response.userSettings.privacy);
      }
    } catch (error) {
      console.error("Lỗi khi lấy cài đặt quyền riêng tư:", error);
      toast.error("Không thể tải cài đặt quyền riêng tư");
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockList = async () => {
    try {
      setBlockListLoading(true);
      const response = await UserSettingsService.getBlockList();
      if (response.success && response.blockedUsers) {
        setBlockedUsers(response.blockedUsers);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách chặn:", error);
    } finally {
      setBlockListLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrivacyData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSavePrivacy = async (section) => {
    try {
      setLoading(true);
      await UserSettingsService.updatePrivacySettings(privacyData);
      toast.success("Cài đặt quyền riêng tư đã được lưu");
    } catch (error) {
      console.error("Lỗi khi cập nhật quyền riêng tư:", error);
      toast.error("Lỗi khi lưu cài đặt");
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (e) => {
    e.preventDefault();
    if (!newBlockUser.trim()) return;

    try {
      setBlockListLoading(true);
      await UserSettingsService.blockUser(newBlockUser);
      toast.success("Đã chặn người dùng thành công");
      setNewBlockUser("");
      await fetchBlockList();
    } catch (error) {
      console.error("Lỗi khi chặn người dùng:", error);
      toast.error("Không thể chặn người dùng này");
    } finally {
      setBlockListLoading(false);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      setBlockListLoading(true);
      await UserSettingsService.unblockUser(userId);
      toast.success("Đã bỏ chặn người dùng");
      await fetchBlockList();
    } catch (error) {
      console.error("Lỗi khi bỏ chặn người dùng:", error);
      toast.error("Không thể bỏ chặn người dùng này");
    } finally {
      setBlockListLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 space-y-10 bg-neutral-50 border border-neutral-200 rounded-xl">
      <h1 className="text-2xl font-semibold text-neutral-800">
        Cài Đặt Quyền Riêng Tư
      </h1>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">Hiển Thị Hồ Sơ</h2>
        <select
          name="profileVisibility"
          value={privacyData.profileVisibility}
          onChange={handleChange}
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="public">Công khai</option>
          <option value="friends">Chỉ bạn bè</option>
          <option value="private">Riêng tư</option>
        </select>
        <div className="flex justify-end">
          <button
            className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition disabled:opacity-50"
            onClick={() => handleSavePrivacy("profile")}
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Hiển Thị Trong Tìm Kiếm
        </h2>
        <p className="text-sm text-neutral-500">
          Kiểm soát liệu người khác có thể tìm thấy hồ sơ của bạn thông qua các
          công cụ tìm kiếm.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="searchable"
            name="searchable"
            checked={privacyData.searchable}
            onChange={handleChange}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="searchable" className="text-sm text-neutral-700">
            Cho phép công cụ tìm kiếm lập chỉ mục hồ sơ của tôi
          </label>
        </div>
        <div className="flex justify-end">
          <button
            className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition disabled:opacity-50"
            onClick={() => handleSavePrivacy("search")}
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Tùy Chọn Chia Sẻ Dữ Liệu
        </h2>
        <p className="text-sm text-neutral-500">
          Chọn nếu bạn cho phép chúng tôi chia sẻ dữ liệu với dịch vụ bên thứ ba
          để trải nghiệm cá nhân hóa.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="dataSharing"
            name="dataSharing"
            checked={privacyData.dataSharing}
            onChange={handleChange}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="dataSharing" className="text-sm text-neutral-700">
            Cho phép chia sẻ dữ liệu
          </label>
        </div>
        <div className="flex justify-end">
          <button
            className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition disabled:opacity-50"
            onClick={() => handleSavePrivacy("data")}
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Người Dùng Đã Chặn
        </h2>
        <p className="text-sm text-neutral-500">
          Quản lý người dùng bạn đã chặn tương tác với bạn.
        </p>

        <form onSubmit={handleBlockUser} className="flex gap-2">
          <input
            type="text"
            placeholder="Nhập email hoặc ID người dùng"
            value={newBlockUser}
            onChange={(e) => setNewBlockUser(e.target.value)}
            className="flex-1 p-2 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition"
          >
            Chặn
          </button>
        </form>

        <div className="space-y-2">
          {blockListLoading ? (
            <p className="text-sm text-neutral-500">
              Đang tải danh sách chặn...
            </p>
          ) : blockedUsers.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Bạn chưa chặn người dùng nào
            </p>
          ) : (
            blockedUsers.map((user) => (
              <div
                key={user.id}
                className="flex justify-between items-center p-3 border border-neutral-300 rounded-md"
              >
                <span className="text-sm text-neutral-700">
                  {user.email || user.id}
                </span>
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition"
                  onClick={() => handleUnblockUser(user.id)}
                >
                  Bỏ chặn
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default PrivacySettings;
