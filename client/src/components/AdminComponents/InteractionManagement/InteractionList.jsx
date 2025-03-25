import React from "react";
import {
  Heart,
  MessageSquare,
  Share,
  Eye,
  Trash,
  AlertTriangle,
  User,
} from "lucide-react";

const InteractionList = ({ interactions = [], onRemove, onViewUser }) => {
  // Lấy biểu tượng dựa trên loại tương tác
  const getInteractionIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart className="text-red-500" size={16} />;
      case "comment":
        return <MessageSquare className="text-blue-500" size={16} />;
      case "share":
        return <Share className="text-green-500" size={16} />;
      case "view":
        return <Eye className="text-purple-500" size={16} />;
      default:
        return <AlertTriangle className="text-orange-500" size={16} />;
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mt-6">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          Tương tác gần đây
        </h3>
      </div>

      {interactions.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          Không có dữ liệu tương tác.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Người dùng
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Loại
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nội dung
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Đối tượng
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Thời gian
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {interactions.map((interaction) => (
                <tr key={interaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <img
                          className="h-8 w-8 rounded-full"
                          src={
                            interaction.user?.avatar ||
                            "https://via.placeholder.com/32"
                          }
                          alt=""
                        />
                      </div>
                      <div className="ml-3">
                        <div
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                          onClick={() => onViewUser(interaction.user.id)}
                        >
                          {interaction.user?.name || "Người dùng ẩn danh"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getInteractionIcon(interaction.type)}
                      <span className="ml-1 text-sm text-gray-900 capitalize">
                        {interaction.type === "like"
                          ? "Thích"
                          : interaction.type === "comment"
                          ? "Bình luận"
                          : interaction.type === "share"
                          ? "Chia sẻ"
                          : interaction.type === "view"
                          ? "Xem"
                          : interaction.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {interaction.content || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {interaction.targetType === "post"
                        ? "Bài viết"
                        : interaction.targetType === "comment"
                        ? "Bình luận"
                        : interaction.targetType === "user"
                        ? "Người dùng"
                        : interaction.targetType}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {interaction.targetId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {interaction.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onRemove(interaction.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Xóa tương tác"
                    >
                      <Trash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InteractionList;
