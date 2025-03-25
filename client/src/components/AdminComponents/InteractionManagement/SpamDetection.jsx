import React, { useState } from "react";
import {
  Flag,
  ShieldAlert,
  UserX,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Ban,
} from "lucide-react";

const SpamDetection = ({
  accounts = [],
  onFlag,
  onViewDetails,
  onBanAccount,
}) => {
  const [showDetails, setShowDetails] = useState(null);

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-orange-600 bg-orange-50";
      case "low":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <ShieldAlert className="text-orange-500 mr-2" size={20} />
          Phát hiện hoạt động bất thường
        </h3>
        <span className="text-sm text-gray-500">
          {accounts.length} tài khoản cần xem xét
        </span>
      </div>

      <div className="overflow-x-auto">
        {accounts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Không có tài khoản đáng ngờ nào được phát hiện.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tài khoản
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Mức độ rủi ro
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Hành vi bất thường
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Thời gian phát hiện
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Trạng thái
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
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={
                            account.avatar || "https://via.placeholder.com/40"
                          }
                          alt=""
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {account.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {account.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskLevelColor(
                        account.riskLevel
                      )}`}
                    >
                      {account.riskLevel === "high"
                        ? "Cao"
                        : account.riskLevel === "medium"
                        ? "Trung bình"
                        : "Thấp"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.suspiciousActivity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.detectedAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        account.isFlagged
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {account.isFlagged ? "Đã đánh dấu" : "Chưa xử lý"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onViewDetails(account.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => onFlag(account.id)}
                        className={`${
                          account.isFlagged
                            ? "text-gray-400"
                            : "text-orange-600 hover:text-orange-900"
                        }`}
                        disabled={account.isFlagged}
                        title="Đánh dấu"
                      >
                        <Flag size={18} />
                      </button>
                      <button
                        onClick={() => onBanAccount(account.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Cấm tài khoản"
                      >
                        <Ban size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SpamDetection;
