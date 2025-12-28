import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useRevenueStats, useTransactions } from '@/hooks/useAdminQuery';

export default function Revenue() {
  const [dateRange, setDateRange] = useState('thisMonth');
  const [transactionType, setTransactionType] = useState('all');

  // Fetch Revenue Stats
  const { data: revenueStats, isLoading: loadingStats } = useRevenueStats();

  // Fetch Transactions
  const { data: transactionsData, isLoading: loadingTransactions } =
    useTransactions({
      page: 1,
      limit: 10,
      type: transactionType !== 'all' ? transactionType : undefined,
    });

  const transactions = transactionsData?.transactions || [];

  const stats = {
    total: revenueStats?.total ?? 0,
    thisMonth: revenueStats?.thisMonth ?? 0,
    lastMonth: revenueStats?.lastMonth ?? 0,
    growth: revenueStats?.growth ?? 0,
    transactions: revenueStats?.transactions ?? 0,
    avgTransaction: revenueStats?.avgTransaction ?? 0,
    chartData: revenueStats?.chartData ?? [],
  };

  const chartData = stats.chartData || [];

  const handleTransactionFilter = type => {
    setTransactionType(type);
    // React Query will specificially refetch when type changes because it is in queryKey
  };

  if ((loadingStats || loadingTransactions) && !revenueStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Doanh thu & Tài chính
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Theo dõi hiệu suất kinh doanh và giao dịch
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none cursor-pointer"
            >
              <option value="thisMonth">Tháng này</option>
              <option value="lastMonth">Tháng trước</option>
              <option value="thisYear">Năm nay</option>
              <option value="all">Tất cả</option>
            </select>
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity">
            <Download size={18} />
            <span className="hidden sm:inline">Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Tổng doanh thu',
            value: `${(stats.total || 0).toLocaleString()} đ`,
            icon: DollarSign,
            change: stats.growth,
            isPositive: (stats.growth || 0) >= 0,
          },
          {
            label: 'Doanh thu tháng này',
            value: `${(stats.thisMonth || 0).toLocaleString()} đ`,
            icon: TrendingUp,
            change: stats.growth, // Or calculate month-over-month specific growth if available
            isPositive: (stats.growth || 0) >= 0,
          },
          {
            label: 'Tổng giao dịch',
            value: stats.transactions || 0,
            icon: CreditCard,
          },
          {
            label: 'Giá trị trung bình',
            value: `${Math.round(
              stats.avgTransaction || 0
            ).toLocaleString()} đ`,
            icon: Filter,
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white">
                <stat.icon size={20} />
              </div>
              {stat.change !== undefined && (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.isPositive ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {stat.isPositive ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                  {Math.abs(stat.change).toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
              {stat.label}
            </p>
            <h3 className="text-2xl font-bold text-black dark:text-white mt-1">
              {stat.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-black dark:text-white">
              Biểu đồ doanh thu
            </h2>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#525252"
                  opacity={0.2}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#737373' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#737373' }}
                  tickFormatter={value => `${value / 1000000}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={value => [
                    `${value.toLocaleString()} đ`,
                    'Doanh thu',
                  ]}
                />
                <Bar
                  dataKey="revenue"
                  fill="currentColor"
                  className="fill-black dark:fill-white"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-black dark:text-white">
              Giao dịch gần đây
            </h2>
            <select
              value={transactionType}
              onChange={e => handleTransactionFilter(e.target.value)}
              className="text-sm bg-transparent text-neutral-500 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="premium">Premium</option>
              <option value="boost">Boost</option>
              <option value="ads">Ads</option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
            {transactions && transactions.length > 0 ? (
              transactions.map(transaction => (
                <div
                  key={transaction.id || transaction._id}
                  className="flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        transaction.user?.avatar ||
                        `https://ui-avatars.com/api/?name=${
                          transaction.user?.name || 'User'
                        }`
                      }
                      alt={transaction.user?.name}
                      className="w-10 h-10 rounded-full object-cover bg-neutral-100"
                    />
                    <div>
                      <p className="font-medium text-black dark:text-white text-sm">
                        {transaction.user?.name || 'Người dùng ẩn danh'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {new Date(transaction.createdAt).toLocaleDateString(
                          'vi-VN'
                        )}{' '}
                        • <span className="capitalize">{transaction.type}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-black dark:text-white text-sm">
                      +{transaction.amount?.toLocaleString()} đ
                    </p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        transaction.status === 'completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                    >
                      {transaction.status === 'completed'
                        ? 'Thành công'
                        : 'Đang xử lý'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-neutral-500 text-sm">
                Chưa có giao dịch nào
              </div>
            )}
          </div>
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
            <button className="w-full py-2 text-sm font-medium text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors">
              Xem tất cả
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
