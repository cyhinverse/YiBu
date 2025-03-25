import React, { memo } from "react";
import {
  Eye,
  Trash2,
  Lock,
  Unlock,
  Shield,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";

// Tối ưu hóa với memo để tránh re-render không cần thiết
const UserTable = memo(
  ({
    users,
    handleUserDetail,
    handleDeleteUser,
    submitUnbanUser,
    handleBanUser,
    sortBy,
    sortDirection,
    setSortBy,
    setSortDirection,
  }) => {
    // Function để xử lý sắp xếp khi nhấn vào header của bảng
    const handleSort = (field) => {
      if (sortBy === field) {
        // Nếu đã sắp xếp trên trường này, đảo chiều
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        // Nếu chọn trường mới, mặc định giảm dần
        setSortBy(field);
        setSortDirection("desc");
      }
    };

    // Tạo component cho header bảng để tái sử dụng
    const TableHeader = ({ field, label }) => {
      const isSorted = sortBy === field;
      return (
        <th
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
          onClick={() => handleSort(field)}
        >
          <div className="flex items-center">
            {label}
            {isSorted && (
              <span className="ml-1">
                {sortDirection === "asc" ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </span>
            )}
          </div>
        </th>
      );
    };

    return (
      <div className="overflow-x-auto">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertTriangle size={32} className="text-yellow-500 mb-2" />
            <p className="text-gray-500">Không có dữ liệu người dùng nào</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TableHeader field="name" label="Người dùng" />
                <TableHeader field="email" label="Email" />
                <TableHeader field="createdAt" label="Ngày tạo" />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quyền
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={user.avatar}
                          alt={user.name}
                          onError={(e) => {
                            // Fallback khi ảnh lỗi
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.name
                            )}&background=random`;
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isBanned ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Bị cấm
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Hoạt động
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isAdmin ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        <Shield size={12} className="mr-1" />
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Thành viên
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleUserDetail(user)}
                        className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                        title="Xóa người dùng"
                      >
                        <Trash2 size={16} />
                      </button>
                      {user.isBanned ? (
                        <button
                          onClick={() => submitUnbanUser(user._id)}
                          className="text-green-600 hover:text-green-900 transition-colors p-1 rounded hover:bg-green-50"
                          title="Bỏ cấm người dùng"
                        >
                          <Unlock size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBanUser(user)}
                          className="text-orange-600 hover:text-orange-900 transition-colors p-1 rounded hover:bg-orange-50"
                          title="Cấm người dùng"
                        >
                          <Lock size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }
);

UserTable.displayName = "UserTable";

export default UserTable;
