import { useState, useMemo } from 'react';
import {
  Users,
  FileText,
  MessageSquare,
  Heart,
  ArrowUpRight,
  RefreshCcw,
  Activity,
  Calendar,
} from 'lucide-react';

import {
  useDashboardStats,
  useUserGrowth,
  useTopUsers,
} from '@/hooks/useAdminQuery';

import UserGrowthChart from './UserGrowthChart';
import StatCard from '../Shared/StatCard';

const Dashboard = () => {
  const [period, setPeriod] = useState(30);

  // Calculate dates for user growth
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - period);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [period]);

  // Queries
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useDashboardStats();

  const {
    data: topUsersData,
    isLoading: usersLoading,
    refetch: refetchTopUsers,
  } = useTopUsers(1, 5);

  const topUsers = topUsersData?.users || [];

  const { data: growthData, isLoading: growthLoading } = useUserGrowth(
    startDate,
    endDate
  );

  const handleRefresh = () => {
    refetchStats();
    refetchTopUsers();
  };

  const statCards = [
    {
      title: 'Tổng người dùng',
      value: stats?.totalUsers?.toLocaleString() || '0',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      // Minimalist: Use neutral backgrounds with specific text accents only
      bg: 'bg-neutral-100 dark:bg-neutral-800',
      iconColor: 'text-neutral-900 dark:text-neutral-100',
    },
    {
      title: 'Bài viết mới',
      value: stats?.totalPosts?.toLocaleString() || '0',
      change: '+8.2%',
      trend: 'up',
      icon: FileText,
      bg: 'bg-neutral-100 dark:bg-neutral-800',
      iconColor: 'text-neutral-900 dark:text-neutral-100',
    },
    {
      title: 'Bình luận',
      value: stats?.totalComments?.toLocaleString() || '0',
      change: '-2.4%',
      trend: 'down',
      icon: MessageSquare,
      bg: 'bg-neutral-100 dark:bg-neutral-800',
      iconColor: 'text-neutral-900 dark:text-neutral-100',
    },
    {
      title: 'Lượt tương tác',
      value: stats?.totalInteractions?.toLocaleString() || '0',
      change: '+24.5%',
      trend: 'up',
      icon: Activity,
      bg: 'bg-neutral-100 dark:bg-neutral-800',
      iconColor: 'text-neutral-900 dark:text-neutral-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Tổng quan
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            Số liệu thống kê hôm nay
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={e => setPeriod(Number(e.target.value))}
            className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 transition-all cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <option value={7}>7 ngày qua</option>
            <option value={30}>30 ngày qua</option>
            <option value={90}>3 tháng qua</option>
          </select>
          <button
            onClick={handleRefresh}
            className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <RefreshCcw
              size={18}
              strokeWidth={2}
              className={statsLoading ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconBgClass={stat.bg}
            iconColorClass={stat.iconColor}
            change={stat.change}
            trend={stat.trend}
            loading={statsLoading}
          />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-100 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Tăng trưởng người dùng
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {growthData?.totalGrowth || 0}
                </span>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                  +{growthData?.percentage || 0}%
                </span>
              </div>
            </div>
            <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
              <Calendar size={20} className="text-neutral-500" />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <UserGrowthChart data={growthData?.chartData || []} />
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-100 dark:border-neutral-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Người dùng tích cực
            </h3>
            <button className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
              Xem tất cả
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {usersLoading
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                      </div>
                    </div>
                  ))
              : topUsers.map((user, index) => (
                  <div
                    key={user._id}
                    className="flex items-center gap-3 group cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 p-2 -mx-2 rounded-xl transition-colors"
                  >
                    <div className="relative">
                      <img
                        src={user.avatar || 'https://via.placeholder.com/40'}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-neutral-900 rounded-full flex items-center justify-center text-[10px] font-bold border border-neutral-100 dark:border-neutral-800">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                        {user.username}
                      </h4>
                      <p className="text-xs text-neutral-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                        <FileText size={10} />
                        {user.postCount || 0}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        <Heart size={10} />
                        {user.totalLikes || 0}
                      </div>
                    </div>
                  </div>
                ))}
          </div>

          <button className="w-full mt-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2">
            Xem báo cáo chi tiết
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
