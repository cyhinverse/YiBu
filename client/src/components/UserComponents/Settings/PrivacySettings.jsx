import React, { useState, useEffect } from "react";
import UserSettingsService from "../../../services/userSettingsService";
import { toast } from "react-toastify";
import {
  User,
  Shield,
  EyeOff,
  Search,
  MessageCircle,
  FileText,
  Loader2,
} from "lucide-react";

const PrivacySettings = () => {
  const [loading, setLoading] = useState(false);
  const [blockListLoading, setBlockListLoading] = useState(false);
  const [privacyData, setPrivacyData] = useState({
    profileVisibility: "public",
    postVisibility: "public",
    messagePermission: "everyone",
    searchVisibility: true,
    activityStatus: true,
  });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [newBlockUser, setNewBlockUser] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    fetchSettings();
    fetchBlockList();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await UserSettingsService.getAllSettings();
      console.log("Received settings:", response);
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
      console.log("Block list response:", response);
      if (response.success && response.blockList) {
        setBlockedUsers(response.blockList);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách chặn:", error);
      toast.error("Không thể tải danh sách người dùng đã chặn");
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

  const handleSavePrivacy = async () => {
    try {
      setLoading(true);
      setActiveSection("saving");

      console.log("Saving privacy settings:", privacyData);
      const response = await UserSettingsService.updatePrivacySettings(
        privacyData
      );

      if (response.success) {
        toast.success("Cài đặt quyền riêng tư đã được lưu");
      } else {
        toast.error(response.message || "Lỗi khi lưu cài đặt");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật quyền riêng tư:", error);
      toast.error("Lỗi khi lưu cài đặt");
    } finally {
      setLoading(false);
      setActiveSection(null);
    }
  };

  const handleBlockUser = async (e) => {
    e.preventDefault();
    if (!newBlockUser.trim()) {
      toast.error("Vui lòng nhập email, username hoặc ID người dùng");
      return;
    }

    try {
      setBlockListLoading(true);
      console.log("Gửi yêu cầu chặn user:", newBlockUser);

      const response = await UserSettingsService.blockUser(newBlockUser);

      if (response.success) {
        toast.success("Đã chặn người dùng thành công");
        setNewBlockUser("");
        await fetchBlockList();
      } else {
        toast.error(response.message || "Không thể chặn người dùng này");
      }
    } catch (error) {
      console.error("Lỗi khi chặn người dùng:", error);

      // Hiển thị thông báo lỗi chi tiết từ API nếu có
      const errorMessage =
        error.response?.data?.message ||
        "Không thể chặn người dùng này. Vui lòng kiểm tra lại thông tin.";

      toast.error(errorMessage);
    } finally {
      setBlockListLoading(false);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      setBlockListLoading(true);
      const response = await UserSettingsService.unblockUser(userId);

      if (response.success) {
        toast.success("Đã bỏ chặn người dùng");
        await fetchBlockList();
      } else {
        toast.error(response.message || "Không thể bỏ chặn người dùng này");
      }
    } catch (error) {
      console.error("Lỗi khi bỏ chặn người dùng:", error);
      toast.error("Không thể bỏ chặn người dùng này");
    } finally {
      setBlockListLoading(false);
    }
  };

  const filteredBlockedUsers = blockedUsers.filter((user) => {
    const searchValue = searchTerm.toLowerCase();
    const username = (user.username || "").toLowerCase();
    const name = (user.name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    return (
      username.includes(searchValue) ||
      name.includes(searchValue) ||
      email.includes(searchValue)
    );
  });

  return (
    <div className="w-full max-w-3xl mx-auto p-6 space-y-8 bg-white border border-neutral-200 rounded-xl shadow-sm">
      <div className="flex items-center space-x-3 pb-3 border-b border-neutral-200">
        <Shield className="text-blue-600" size={24} />
        <h1 className="text-2xl font-semibold text-neutral-800">
          Cài Đặt Quyền Riêng Tư
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Hiển thị hồ sơ */}
        <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 hover:shadow-md transition">
          <div className="flex items-center space-x-2 mb-3">
            <User className="text-blue-600" size={20} />
            <h2 className="text-lg font-medium text-neutral-700">
              Hiển Thị Hồ Sơ
            </h2>
          </div>

          <p className="text-sm text-neutral-500 mb-4">
            Chọn ai có thể xem thông tin hồ sơ của bạn
          </p>

          <div className="space-y-4">
            <select
              name="profileVisibility"
              value={privacyData.profileVisibility}
              onChange={handleChange}
              className="w-full p-2.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="public">Công khai (Mọi người)</option>
              <option value="friends">Chỉ bạn bè</option>
              <option value="private">Riêng tư (Chỉ mình tôi)</option>
            </select>
          </div>
        </section>

        {/* Hiển thị bài viết */}
        <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 hover:shadow-md transition">
          <div className="flex items-center space-x-2 mb-3">
            <FileText className="text-blue-600" size={20} />
            <h2 className="text-lg font-medium text-neutral-700">
              Hiển Thị Bài Viết
            </h2>
          </div>

          <p className="text-sm text-neutral-500 mb-4">
            Chọn ai có thể xem bài viết của bạn mặc định
          </p>

          <div className="space-y-4">
            <select
              name="postVisibility"
              value={privacyData.postVisibility}
              onChange={handleChange}
              className="w-full p-2.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="public">Công khai (Mọi người)</option>
              <option value="friends">Chỉ bạn bè</option>
              <option value="private">Riêng tư (Chỉ mình tôi)</option>
            </select>
          </div>
        </section>

        {/* Quyền nhắn tin */}
        <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 hover:shadow-md transition">
          <div className="flex items-center space-x-2 mb-3">
            <MessageCircle className="text-blue-600" size={20} />
            <h2 className="text-lg font-medium text-neutral-700">
              Quyền Nhắn Tin
            </h2>
          </div>

          <p className="text-sm text-neutral-500 mb-4">
            Chọn ai có thể gửi tin nhắn cho bạn
          </p>

          <div className="space-y-4">
            <select
              name="messagePermission"
              value={privacyData.messagePermission}
              onChange={handleChange}
              className="w-full p-2.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="everyone">Tất cả mọi người</option>
              <option value="friends">Chỉ bạn bè</option>
              <option value="none">Không ai (Tắt tin nhắn)</option>
            </select>
          </div>
        </section>

        {/* Hiển thị trong tìm kiếm */}
        <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 hover:shadow-md transition">
          <div className="flex items-center space-x-2 mb-3">
            <Search className="text-blue-600" size={20} />
            <h2 className="text-lg font-medium text-neutral-700">
              Hiển Thị Trong Tìm Kiếm
            </h2>
          </div>

          <p className="text-sm text-neutral-500 mb-4">
            Kiểm soát liệu người khác có thể tìm thấy hồ sơ của bạn
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="searchVisibility"
                name="searchVisibility"
                checked={privacyData.searchVisibility}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="searchVisibility"
                className="text-sm text-neutral-700"
              >
                Cho phép người khác tìm thấy tôi
              </label>
            </div>
          </div>
        </section>

        {/* Trạng thái hoạt động */}
        <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 hover:shadow-md transition">
          <div className="flex items-center space-x-2 mb-3">
            <EyeOff className="text-blue-600" size={20} />
            <h2 className="text-lg font-medium text-neutral-700">
              Trạng Thái Hoạt Động
            </h2>
          </div>

          <p className="text-sm text-neutral-500 mb-4">
            Hiển thị trạng thái hoạt động của bạn cho người khác
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="activityStatus"
                name="activityStatus"
                checked={privacyData.activityStatus}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="activityStatus"
                className="text-sm text-neutral-700"
              >
                Hiển thị khi tôi đang hoạt động
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* Nút lưu tất cả */}
      <div className="flex justify-center mt-6">
        <button
          className="px-6 py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center"
          onClick={handleSavePrivacy}
          disabled={loading && activeSection === "saving"}
        >
          {loading && activeSection === "saving" ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
              Đang lưu...
            </>
          ) : (
            "Lưu tất cả thay đổi"
          )}
        </button>
      </div>

      {/* Danh sách người dùng đã chặn */}
      <section className="mt-10 bg-neutral-50 p-5 rounded-lg border border-neutral-200">
        <div className="flex items-center space-x-2 mb-4">
          <User className="text-red-500" size={20} />
          <h2 className="text-lg font-medium text-neutral-700">
            Người Dùng Đã Chặn
          </h2>
        </div>

        <p className="text-sm text-neutral-500 mb-4">
          Quản lý danh sách người dùng bạn đã chặn tương tác. Họ sẽ không thể
          xem hồ sơ, bài viết hoặc nhắn tin cho bạn.
        </p>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Hướng dẫn:</span> Bạn có thể chặn
            người dùng bằng cách nhập email, tên người dùng (username) hoặc ID
            của họ vào ô bên dưới.
          </p>
        </div>

        <form onSubmit={handleBlockUser} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Nhập email hoặc ID người dùng"
            value={newBlockUser}
            onChange={(e) => setNewBlockUser(e.target.value)}
            className="flex-1 p-2.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition flex items-center gap-1"
            disabled={blockListLoading}
          >
            {blockListLoading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 text-white" />
                Đang xử lý...
              </>
            ) : (
              "Chặn người dùng"
            )}
          </button>
        </form>

        {/* Tìm kiếm trong danh sách chặn */}
        {blockedUsers.length > 0 && (
          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm người dùng đã chặn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full p-2.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {blockListLoading && blockedUsers.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
              <span className="ml-2 text-sm text-neutral-500">
                Đang tải danh sách chặn...
              </span>
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-neutral-300 rounded-lg">
              <p className="text-sm text-neutral-500">
                Bạn chưa chặn người dùng nào
              </p>
            </div>
          ) : filteredBlockedUsers.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-neutral-300 rounded-lg">
              <p className="text-sm text-neutral-500">
                Không tìm thấy người dùng nào khớp với tìm kiếm "{searchTerm}"
              </p>
            </div>
          ) : (
            filteredBlockedUsers.map((user) => (
              <div
                key={user._id || user.id}
                className="flex justify-between items-center p-3 bg-white border border-neutral-200 rounded-md hover:shadow-sm transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-200">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="text-neutral-400" size={20} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-neutral-800">
                      {user.name || user.username || "Người dùng"}
                    </p>
                    {user.email && (
                      <p className="text-xs text-neutral-500">{user.email}</p>
                    )}
                  </div>
                </div>

                <button
                  className="px-3 py-1.5 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-md text-xs font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                  onClick={() => handleUnblockUser(user._id || user.id)}
                  disabled={blockListLoading}
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
