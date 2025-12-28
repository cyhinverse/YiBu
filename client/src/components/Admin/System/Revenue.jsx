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
  Wallet,
  PieChart,
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
import StatCard from '../Shared/StatCard';
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-800">
          <p className="font-bold text-neutral-900 dark:text-white mb-2">
            {label}
          </p>
          <div className="space-y-1">
            <p className="text-emerald-600 font-medium text-sm">
              Doanh thu:{' '}
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(payload[0].value)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
            <Wallet className="text-neutral-900 dark:text-white" size={24} />
            Doanh thu & Tài chính
          </h2>
          <p className="text-neutral-500 font-medium mt-2">
            Theo dõi hiệu suất kinh doanh và dòng tiền
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="pl-11 pr-5 py-3 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white appearance-none cursor-pointer font-bold text-sm shadow-sm"
            >
              <option value="thisMonth">Tháng này</option>
              <option value="lastMonth">Tháng trước</option>
              <option value="thisYear">Năm nay</option>
              <option value="all">Tất cả</option>
            </select>
          </div>

          <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold hover:opacity-90 transition-all shadow-md active:scale-95">
            <Download size={18} />
            <span className="hidden sm:inline">Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Tổng doanh thu"
          value={new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(stats.total)}
          icon={DollarSign}
          change={`${Math.abs(stats.growth)}%`}
          trend={stats.growth >= 0 ? 'up' : 'down'}
          iconBgClass="bg-emerald-100 dark:bg-emerald-900/30"
          iconColorClass="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Tổng giao dịch"
          value={stats.transactions}
          icon={CreditCard}
          change="+12%"
          trend="up"
          iconBgClass="bg-blue-100 dark:bg-blue-900/30"
          iconColorClass="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Giá trị trung bình"
          value={new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(stats.avgTransaction)}
          icon={PieChart}
          change="Ổn định"
          trend="neutral"
          iconBgClass="bg-violet-100 dark:bg-violet-900/30"
          iconColorClass="text-violet-600 dark:text-violet-400"
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
              Biểu đồ doanh thu
            </h2>
            <p className="text-sm font-medium text-neutral-500">
              Thống kê doanh thu theo thời gian
            </p>
          </div>
          <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-full p-1">
            <button className="px-4 py-1.5 rounded-full bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm text-xs font-bold">
              Ngày
            </button>
            <button className="px-4 py-1.5 rounded-full text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xs font-bold transition-colors">
              Tuần
            </button>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e5e5"
                className="dark:stroke-neutral-800"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#737373', fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#737373', fontSize: 12, fontWeight: 500 }}
                tickFormatter={value => `${value / 1000000}M`}
                dx={-10}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'transparent' }}
              />
              <Bar
                dataKey="value"
                fill="#10b981"
                radius={[8, 8, 8, 8]}
                barSize={40}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Giao dịch gần đây
          </h2>
          <div className="flex gap-2">
            {['all', 'income', 'expense'].map(type => (
              <button
                key={type}
                onClick={() => handleTransactionFilter(type)}
                className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-all ${
                  transactionType === type
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {type === 'all' ? 'Tất cả' : type === 'income' ? 'Thu' : 'Chi'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Giao dịch
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Ngày
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Số tiền
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {transactions.length > 0 ? (
                transactions.map(tx => (
                  <tr
                    key={tx.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl ${
                            tx.type === 'income'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowUpRight size={16} />
                          ) : (
                            <ArrowDownRight size={16} />
                          )}
                        </div>
                        <span className="font-bold text-sm text-neutral-900 dark:text-white">
                          {tx.description || 'Giao dịch hệ thống'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                      {tx.user?.username || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          tx.status === 'completed'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {tx.status === 'completed'
                          ? 'Thành công'
                          : 'Đang xử lý'}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${
                        tx.type === 'income'
                          ? 'text-emerald-600'
                          : 'text-neutral-900 dark:text-white'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(tx.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-10 text-neutral-500 text-sm"
                  >
                    Chưa có giao dịch nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <button className="w-full py-2 text-sm font-medium text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            Xem tất cả
          </button>
        </div>
      </div>
    </div>
  );
}
