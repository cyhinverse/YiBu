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

  const { data: growthData } = useUserGrowth(startDate, endDate);

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
    <div className="admin-page">
      {/* Header */}
      <div className="admin-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Tổng quan
          </p>
          <h2 className="text-2xl font-semibold text-[var(--color-content)]">
            Xin chào! 👋
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Tổng quan hoạt động hôm nay
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={e => setPeriod(Number(e.target.value))}
            className="admin-select"
          >
            <option value={7}>7 ngày</option>
            <option value={30}>30 ngày</option>
            <option value={90}>90 ngày</option>
          </select>
          <button
            type="button"
            onClick={handleRefresh}
            onKeyDown={event => {
              if (event.key === 'Escape') {
                event.currentTarget.blur();
              }
            }}
            className="p-2 rounded-lg bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            aria-label="Tải lại"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
        <div className="lg:col-span-2 admin-card p-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-[var(--color-content)]">
                Tăng trưởng người dùng
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-semibold text-[var(--color-content)]">
                  {growthData?.totalGrowth || 0}
                </span>
                <span className="admin-pill admin-pill-success">
                  +{growthData?.percentage || 0}%
                </span>
              </div>
            </div>
            <div className="p-2 bg-[var(--color-surface-secondary)] rounded-xl text-[var(--color-text-secondary)]">
              <TrendingUp size={18} strokeWidth={1.6} />
            </div>
          </div>
          <div className="h-[240px] w-full">
            <UserGrowthChart data={growthData?.chartData || []} />
          </div>
        </div>

        {/* Top Users */}
        <div className="admin-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[var(--color-content)]">
              Người dùng tích cực
            </h3>
            <button
              type="button"
              className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-content)]"
            >
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
                    className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        src={user.avatar || 'https://via.placeholder.com/40'}
                        alt={user.username}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--color-surface)] rounded-full text-[9px] font-bold flex items-center justify-center text-[var(--color-text-secondary)]">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-[var(--color-content)] truncate">
                        {user.username}
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                      <span className="flex items-center gap-1">
                        <FileText size={12} strokeWidth={1.6} />
                        {user.postCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} strokeWidth={1.6} />
                        {user.totalLikes || 0}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
          <button
            type="button"
            className="w-full mt-4 py-2.5 rounded-xl bg-[var(--color-surface-secondary)] text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors flex items-center justify-center gap-2"
          >
            Xem chi tiết
            <ArrowUpRight size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );

};

export default Dashboard;
