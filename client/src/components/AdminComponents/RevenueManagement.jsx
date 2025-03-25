import React, { useState } from "react";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Tag,
  CreditCard,
  Download,
  Filter,
  ChevronDown,
  Search,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";

const RevenueManagement = () => {
  const [timeRange, setTimeRange] = useState("month");
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState(mockTransactions);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === "all") return matchesSearch;
    return matchesSearch && transaction.type === filterType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Quản Lý Doanh Thu</h2>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm giao dịch..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
          </div>

          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
              <Filter size={16} />
              <span>Loại</span>
              <ChevronDown size={16} />
            </button>

            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1">
                {["all", "premium", "ads", "refund"].map((type) => (
                  <button
                    key={type}
                    className={`flex w-full items-center px-4 py-2 text-sm ${
                      filterType === type
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setFilterType(type)}
                  >
                    {type === "all" && "Tất cả"}
                    {type === "premium" && "Gói premium"}
                    {type === "ads" && "Quảng cáo"}
                    {type === "refund" && "Hoàn tiền"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="inline-flex rounded-md shadow-sm">
            {["day", "week", "month", "year"].map((range) => (
              <button
                key={range}
                type="button"
                className={`px-3 py-2 text-sm font-medium ${
                  timeRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } ${
                  range === "day"
                    ? "rounded-l-md"
                    : range === "year"
                    ? "rounded-r-md"
                    : ""
                } border border-gray-300`}
                onClick={() => setTimeRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          <button className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Revenue overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <RevenueCard
          title="Tổng doanh thu"
          value="24,850"
          change="+8.2%"
          isPositive={true}
          icon={<DollarSign className="text-white" />}
          bgClass="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <RevenueCard
          title="Doanh thu từ Premium"
          value="16,200"
          change="+12.7%"
          isPositive={true}
          icon={<Award className="text-white" />}
          bgClass="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <RevenueCard
          title="Doanh thu từ Quảng cáo"
          value="8,650"
          change="-2.3%"
          isPositive={false}
          icon={<Tag className="text-white" />}
          bgClass="bg-gradient-to-br from-amber-500 to-amber-600"
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Doanh thu theo thời gian
            </h3>
            <span className="text-sm text-gray-500 flex items-center">
              <TrendingUp className="text-green-500 mr-1" size={16} />
              <span>Tăng 8.5% so với {timeRange} trước</span>
            </span>
          </div>

          {/* Chart would go here - simulating with bars for now */}
          <div className="h-64 flex items-end space-x-2">
            {[65, 59, 80, 81, 56, 55, 70, 75, 62, 68, 82, 71].map(
              (height, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-all duration-200"
                    style={{ height: `${height}%` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-1">
                    {index + 1}
                  </span>
                </div>
              )
            )}
          </div>

          <div className="flex items-center justify-center mt-6 space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Premium</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Quảng cáo</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Tổng cộng</span>
            </div>
          </div>
        </div>

        {/* User metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Số liệu người dùng
            </h3>
            <span className="text-sm text-gray-500">Theo {timeRange}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-blue-500 text-white mr-3">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tổng người dùng</p>
                  <h4 className="text-xl font-bold text-gray-800">1,254</h4>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-purple-500 text-white mr-3">
                  <Award size={18} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Người dùng Premium</p>
                  <h4 className="text-xl font-bold text-gray-800">186</h4>
                </div>
              </div>
            </div>
          </div>

          {/* Donut Chart Simulation */}
          <div className="h-40 flex items-center justify-center">
            <div className="relative w-32 h-32">
              <div
                className="absolute inset-0 rounded-full border-12 border-purple-500"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% 15%, 0% 15%)" }}
              ></div>
              <div
                className="absolute inset-0 rounded-full border-12 border-gray-300"
                style={{
                  clipPath: "polygon(0 15%, 100% 15%, 100% 100%, 0% 100%)",
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-800">15%</div>
                  <div className="text-xs text-gray-500">Premium</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-600 mt-2">
            <p>Tỷ lệ người dùng đăng ký gói Premium</p>
            <p className="text-green-600 font-medium mt-1 flex items-center justify-center">
              <ArrowUp size={14} className="mr-1" />
              Tăng 3% so với {timeRange} trước
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Lịch sử giao dịch
          </h3>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
            <Download className="mr-1" size={16} />
            Xuất báo cáo
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ID Giao dịch
                </th>
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
                  Ngày
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Phương thức
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Số tiền
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mr-3">
                        <span className="text-sm font-medium text-gray-600">
                          {transaction.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.user.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${
                        transaction.type === "premium"
                          ? "bg-purple-100 text-purple-800"
                          : transaction.type === "ads"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.type === "premium"
                        ? "Premium"
                        : transaction.type === "ads"
                        ? "Quảng cáo"
                        : "Hoàn tiền"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {transaction.date}
                    </div>
                    <div className="text-xs text-gray-500">
                      {transaction.time}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <CreditCard size={14} className="mr-1 text-gray-500" />
                      {transaction.paymentMethod}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div
                      className={`text-sm font-medium ${
                        transaction.type === "refund"
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {transaction.type === "refund" ? "-" : "+"}
                      {transaction.amount}$
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${
                        transaction.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : transaction.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {transaction.status === "completed"
                        ? "Hoàn thành"
                        : transaction.status === "pending"
                        ? "Đang xử lý"
                        : "Đã hủy"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Hiển thị{" "}
            <span className="font-medium">{filteredTransactions.length}</span>{" "}
            trong số <span className="font-medium">{transactions.length}</span>{" "}
            giao dịch
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50">
              Trước
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50">
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RevenueCard = ({ title, value, change, isPositive, icon, bgClass }) => {
  return (
    <div className={`${bgClass} rounded-lg shadow p-6 text-white`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-white text-opacity-80 font-medium">
            {title}
          </p>
          <h4 className="text-2xl font-bold mt-1">${value}</h4>
        </div>
        <div className="p-2 bg-white bg-opacity-20 rounded-lg">{icon}</div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        {isPositive ? (
          <ArrowUp size={14} className="mr-1" />
        ) : (
          <ArrowDown size={14} className="mr-1" />
        )}
        <span className="font-medium">{change}</span>
        <span className="ml-1 text-white text-opacity-80">
          so với tháng trước
        </span>
      </div>
    </div>
  );
};

// Mock data for transactions
const mockTransactions = [
  {
    id: "TRX-2401-1234",
    user: {
      name: "Nguyễn Văn A",
      email: "nguyenvana@example.com",
    },
    type: "premium",
    date: "15/03/2024",
    time: "09:15",
    paymentMethod: "Visa ****4567",
    amount: "59.99",
    status: "completed",
  },
  {
    id: "TRX-2401-1235",
    user: {
      name: "Trần Thị B",
      email: "tranthib@example.com",
    },
    type: "premium",
    date: "16/03/2024",
    time: "14:30",
    paymentMethod: "MasterCard ****7890",
    amount: "99.99",
    status: "completed",
  },
  {
    id: "TRX-2401-1236",
    user: {
      name: "Company XYZ",
      email: "ads@companyxyz.com",
    },
    type: "ads",
    date: "18/03/2024",
    time: "11:45",
    paymentMethod: "Bank Transfer",
    amount: "350.00",
    status: "completed",
  },
  {
    id: "TRX-2401-1237",
    user: {
      name: "Phạm Văn C",
      email: "phamvanc@example.com",
    },
    type: "premium",
    date: "19/03/2024",
    time: "16:20",
    paymentMethod: "PayPal",
    amount: "59.99",
    status: "pending",
  },
  {
    id: "TRX-2401-1238",
    user: {
      name: "Lê Thị D",
      email: "lethid@example.com",
    },
    type: "refund",
    date: "20/03/2024",
    time: "08:50",
    paymentMethod: "Visa ****1234",
    amount: "59.99",
    status: "completed",
  },
  {
    id: "TRX-2401-1239",
    user: {
      name: "Local Business Inc.",
      email: "ads@localbusiness.com",
    },
    type: "ads",
    date: "21/03/2024",
    time: "13:15",
    paymentMethod: "MasterCard ****5678",
    amount: "199.99",
    status: "completed",
  },
  {
    id: "TRX-2401-1240",
    user: {
      name: "Startup Tech",
      email: "marketing@startuptech.com",
    },
    type: "ads",
    date: "22/03/2024",
    time: "10:30",
    paymentMethod: "Bank Transfer",
    amount: "499.99",
    status: "pending",
  },
];

export default RevenueManagement;
