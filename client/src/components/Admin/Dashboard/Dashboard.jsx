import { useState, useMemo } from 'react';
import {
  Users,
  FileText,
  MessageSquare,
  Heart,
  ArrowUpRight,
  RefreshCcw,
  Activity,
  TrendingUp,
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

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - period);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [period]);

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
      color: 'primary',
    },
    {
      title: 'Bài viết mới',
      value: stats?.totalPosts?.toLocaleString() || '0',
      change: '+8.2%',
      trend: 'up',
      icon: FileText,
      color: 'success',
    },
    {
      title: 'Bình luận',
      value: stats?.totalComments?.toLocaleString() || '0',
      change: '-2.4%',
      trend: 'down',
      icon: MessageSquare,
      color: 'warning',
    },
    {
      title: 'Lượt tương tác',
      value: stats?.totalInteractions?.toLocaleString() || '0',
      change: '+24.5%',
      trend: 'up',
      icon: Activity,
      color: 'danger',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-white">
            Xin chào! 👋
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Tổng quan hoạt động hôm nay
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={e => setPeriod(Number(e.target.value))}
            className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value={7}>7 ngày</option>
            <option value={30}>30 ngày</option>
            <option value={90}>90 ngày</option>
          </select>
          <button
            onClick={handleRefresh}
            className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-500 hover:text-neutral-700 dark:hover:text-white transition-colors"
          >
            <RefreshCcw
              size={18}
              strokeWidth={1.5}
              className={statsLoading ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            trend={stat.trend}
            color={stat.color}
            loading={statsLoading}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-neutral-800 dark:text-white">
                Tăng trưởng người dùng
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-semibold text-neutral-800 dark:text-white">
                  {growthData?.totalGrowth || 0}
                </span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  +{growthData?.percentage || 0}%
                </span>
              </div>
            </div>
            <div className="p-2 bg-violet-50 dark:bg-violet-500/10 rounded-xl">
              <TrendingUp
                size={18}
                className="text-violet-600 dark:text-violet-400"
                strokeWidth={1.5}
              />
            </div>
          </div>
          <div className="h-[280px] w-full">
            <UserGrowthChart data={growthData?.chartData || []} />
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-neutral-800 dark:text-white">
              Người dùng tích cực
            </h3>
            <button className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">
              Xem tất cả
            </button>
          </div>
          <div className="flex-1 space-y-3">
            {usersLoading
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 animate-pulse"
                    >
                      <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800" />
                      <div className="flex-1">
                        <div className="h-3.5 w-24 bg-neutral-100 dark:bg-neutral-800 rounded mb-1.5" />
                        <div className="h-3 w-16 bg-neutral-100 dark:bg-neutral-800 rounded" />
                      </div>
                    </div>
                  ))
              : topUsers.map((user, index) => (
                  <div
                    key={user._id}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        src={user.avatar || 'https://via.placeholder.com/40'}
                        alt={user.username}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white dark:bg-neutral-900 rounded-full text-[9px] font-bold flex items-center justify-center shadow-sm text-neutral-600 dark:text-neutral-300">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-neutral-800 dark:text-white truncate">
                        {user.username}
                      </h4>
                      <p className="text-xs text-neutral-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        {user.postCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} />
                        {user.totalLikes || 0}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
          <button className="w-full mt-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2">
            Xem chi tiết
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
