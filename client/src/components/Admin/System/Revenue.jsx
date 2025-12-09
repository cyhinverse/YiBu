import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  CreditCard,
  Users,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const FAKE_REVENUE_DATA = {
  total: 125680000,
  thisMonth: 15420000,
  lastMonth: 12890000,
  growth: 19.6,
  transactions: 1234,
  avgTransaction: 102000,
};

const FAKE_MONTHLY_DATA = [
  { month: "T1", revenue: 8500000 },
  { month: "T2", revenue: 9200000 },
  { month: "T3", revenue: 7800000 },
  { month: "T4", revenue: 11500000 },
  { month: "T5", revenue: 10200000 },
  { month: "T6", revenue: 12890000 },
  { month: "T7", revenue: 15420000 },
];

const FAKE_TRANSACTIONS = [
  {
    id: 1,
    user: {
      name: "Nguyễn Văn A",
      email: "nguyenvana@email.com",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    type: "premium",
    amount: 199000,
    status: "completed",
    createdAt: "2024-01-15 10:30",
  },
  {
    id: 2,
    user: {
      name: "Trần Thị B",
      email: "tranthib@email.com",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    type: "boost",
    amount: 50000,
    status: "completed",
    createdAt: "2024-01-15 09:45",
  },
  {
    id: 3,
    user: {
      name: "Lê Văn C",
      email: "levanc@email.com",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    type: "premium",
    amount: 499000,
    status: "pending",
    createdAt: "2024-01-15 09:15",
  },
  {
    id: 4,
    user: {
      name: "Phạm Thị D",
      email: "phamthid@email.com",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    type: "ads",
    amount: 1500000,
    status: "completed",
    createdAt: "2024-01-15 08:30",
  },
  {
    id: 5,
    user: {
      name: "Hoàng Văn E",
      email: "hoangvane@email.com",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    type: "premium",
    amount: 199000,
    status: "failed",
    createdAt: "2024-01-15 08:00",
  },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const getStatusStyle = (status) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "pending":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "failed":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "completed":
      return "Hoàn thành";
    case "pending":
      return "Chờ xử lý";
    case "failed":
      return "Thất bại";
    default:
      return status;
  }
};

const getTypeText = (type) => {
  switch (type) {
    case "premium":
      return "Premium";
    case "boost":
      return "Boost bài viết";
    case "ads":
      return "Quảng cáo";
    default:
      return type;
  }
};

export default function Revenue() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const maxRevenue = Math.max(...FAKE_MONTHLY_DATA.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Doanh thu
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Tổng quan doanh thu và giao dịch
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="year">Năm nay</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity">
            <Download size={18} />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <DollarSign size={20} />
            </div>
            <span className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              {FAKE_REVENUE_DATA.growth}%
            </span>
          </div>
          <p className="text-white/80 text-sm">Tổng doanh thu</p>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(FAKE_REVENUE_DATA.total)}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar
                size={20}
                className="text-blue-600 dark:text-blue-400"
              />
            </div>
            <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <TrendingUp size={14} />
              +19.6%
            </span>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Tháng này
          </p>
          <p className="text-2xl font-bold text-black dark:text-white mt-1">
            {formatCurrency(FAKE_REVENUE_DATA.thisMonth)}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <CreditCard
                size={20}
                className="text-purple-600 dark:text-purple-400"
              />
            </div>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Giao dịch
          </p>
          <p className="text-2xl font-bold text-black dark:text-white mt-1">
            {FAKE_REVENUE_DATA.transactions.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <ShoppingBag
                size={20}
                className="text-orange-600 dark:text-orange-400"
              />
            </div>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            TB/Giao dịch
          </p>
          <p className="text-2xl font-bold text-black dark:text-white mt-1">
            {formatCurrency(FAKE_REVENUE_DATA.avgTransaction)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
        <h2 className="text-lg font-semibold text-black dark:text-white mb-6">
          Biểu đồ doanh thu theo tháng
        </h2>

        <div className="flex items-end justify-between gap-4 h-64">
          {FAKE_MONTHLY_DATA.map((data, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {formatCurrency(data.revenue).replace("₫", "")}
              </span>
              <div
                className="w-full bg-gradient-to-t from-black to-neutral-600 dark:from-white dark:to-neutral-400 rounded-t-lg transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${(data.revenue / maxRevenue) * 100}%`,
                  minHeight: "20px",
                }}
              />
              <span className="text-sm font-medium text-black dark:text-white">
                {data.month}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-black dark:text-white">
            Giao dịch gần đây
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left px-5 py-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  Người dùng
                </th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  Loại
                </th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  Số tiền
                </th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  Trạng thái
                </th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  Thời gian
                </th>
              </tr>
            </thead>
            <tbody>
              {FAKE_TRANSACTIONS.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={transaction.user.avatar}
                        alt={transaction.user.name}
                        className="w-10 h-10 rounded-full border-2 border-neutral-200 dark:border-neutral-700"
                      />
                      <div>
                        <p className="font-medium text-black dark:text-white">
                          {transaction.user.name}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {transaction.user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-black dark:text-white">
                      {getTypeText(transaction.type)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-black dark:text-white">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                        transaction.status
                      )}`}
                    >
                      {getStatusText(transaction.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      {transaction.createdAt}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <button className="w-full py-2.5 text-center text-sm font-medium text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
            Xem tất cả giao dịch
          </button>
        </div>
      </div>
    </div>
  );
}
