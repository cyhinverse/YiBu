import { useState, useMemo, lazy, Suspense } from 'react';
import {
  Users,
  FileText,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  ArrowUpRight,
  MoreHorizontal,
  RefreshCcw,
  Activity,
  Calendar,
} from 'lucide-react';

import {
  useDashboardStats,
  useUserGrowth,
  useTopUsers,
} from '@/hooks/useAdminQuery';

const UserGrowthChart = lazy(() => import('./UserGrowthChart'));

const StatCard = ({ stat, isLoading }) => (
  <div className="yb-card p-6 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
      <stat.icon size={80} className={stat.iconColor} />
    </div>

    <div className="relative z-10">
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center shadow-inner transition-transform group-hover:scale-105 duration-300`}
        >
          <stat.icon size={28} className={stat.iconColor} />
        </div>
        <div>
          <p className="text-xs font-bold text-secondary uppercase tracking-wider">
            {stat.title}
          </p>
          {!isLoading && (
            <div
              className={`flex items-center gap-1 text-sm font-bold ${
                stat.trend === 'up' ? 'text-success' : 'text-error'
              }`}
            >
              {stat.trend === 'up' ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              {stat.change}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="h-10 w-32 bg-surface-secondary rounded-lg animate-pulse" />
      ) : (
        <h3 className="text-3xl font-black text-primary tracking-tight">
          {stat.value}
        </h3>
      )}
    </div>
  </div>
);

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
  console.log(topUsers);

  const {
    data: userGrowth,
    isLoading: growthLoading,
    refetch: refetchGrowth,
  } = useUserGrowth(startDate, endDate);

  const loading = statsLoading || usersLoading || growthLoading;

  const buildStats = () => {
    const userStats = stats?.users || {};
    const postStats = stats?.posts || {};
    const reportStats = stats?.reports || {};

    return [
      {
        id: 1,
        title: 'Total Users',
        value: (userStats.total || 0).toLocaleString(),
        change: `${userStats.newThisWeek || 0} new`,
        trend: 'up',
        icon: Users,
        bg: 'bg-primary/5 dark:bg-primary/10',
        iconColor: 'text-primary',
      },
      {
        id: 2,
        title: 'Total Posts',
        value: (postStats.total || 0).toLocaleString(),
        change: `${postStats.thisWeek || 0} n mới`,
        trend: 'up',
        icon: FileText,
        bg: 'bg-accent/5 dark:bg-accent/10',
        iconColor: 'text-accent',
      },
      {
        id: 3,
        title: 'Pending Reports',
        value: (reportStats.pending || 0).toLocaleString(),
        change: 'Cần xử lý',
        trend: reportStats.pending > 0 ? 'down' : 'up',
        icon: MessageSquare,
        bg: 'bg-warning/5 dark:bg-warning/10',
        iconColor: 'text-warning',
      },
      {
        id: 4,
        title: 'Active Now',
        value: (userStats.active || 0).toLocaleString(),
        change: 'Trực tuyến',
        trend: 'up',
        icon: Activity,
        bg: 'bg-success/5 dark:bg-success/10',
        iconColor: 'text-success',
      },
    ];
  };

  const chartData =
    userGrowth?.map(item => ({
      name: new Date(item._id).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      users: item.count,
    })) || [];

  const activities = stats?.recentActivities || [];
  const recentUsers = stats?.recentUsers || [];
  const topPosts = stats?.topPosts || [];

  const handleRefresh = () => {
    refetchStats();
    refetchTopUsers();
    refetchGrowth();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      {/* Header */}
      <div className="yb-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-secondary/30">
        <div>
          <h2 className="text-2xl font-black text-primary tracking-tight">
            Tổng quan
          </h2>
          <p className="text-sm text-secondary mt-1 flex items-center gap-2 font-medium">
            <Calendar size={14} />
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={e => setPeriod(Number(e.target.value))}
            className="yb-input py-2.5 px-4 text-sm font-bold min-w-[160px]"
          >
            <option value={7}>7 ngày qua</option>
            <option value={30}>30 ngày qua</option>
            <option value={90}>3 tháng qua</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="yb-btn yb-btn-primary p-2.5 shadow-lg shadow-primary/10"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {buildStats().map(stat => (
          <StatCard key={stat.id} stat={stat} isLoading={loading && !stats} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 yb-card p-8 group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-primary tracking-tight">
                Tăng trưởng người dùng
              </h3>
              <p className="text-sm text-secondary font-medium">
                Số lượng đăng ký mới theo thời gian
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-secondary">
              <TrendingUp size={20} />
            </div>
          </div>
          <Suspense
            fallback={
              <div className="h-80 w-full flex items-center justify-center bg-surface-secondary/20 rounded-xl animate-pulse">
                <Activity className="animate-spin text-primary/30" size={32} />
              </div>
            }
          >
            <UserGrowthChart data={chartData} />
          </Suspense>
        </div>

        {/* Recent Activities */}
        <div className="yb-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-primary tracking-tight">
              Hoạt động gần đây
            </h3>
            <button className="text-sm font-bold text-primary hover:underline decoration-2 underline-offset-4">
              Xem tất cả
            </button>
          </div>
          <div className="space-y-6">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-secondary font-medium">
                Chưa có hoạt động nào
              </div>
            ) : (
              activities.slice(0, 5).map((activity, index) => (
                <div key={activity._id || index} className="flex gap-4 group">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-surface-secondary flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300 shadow-sm border border-border/50">
                      <Activity size={18} />
                    </div>
                    {index !== activities.slice(0, 5).length - 1 && (
                      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-px h-10 bg-border/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary line-clamp-2">
                      {activity.details || activity.message || activity.action}
                    </p>
                    <p className="text-xs text-secondary font-medium mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* New Users */}
        <div className="yb-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-primary tracking-tight">
              Thành viên mới
            </h3>
            <button className="p-2 hover:bg-surface-secondary rounded-xl transition-colors text-secondary">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="space-y-4">
            {recentUsers.slice(0, 5).map(user => (
              <div
                key={user._id}
                className="flex items-center gap-4 p-4 hover:bg-surface-secondary/50 rounded-2xl transition-all group cursor-pointer border border-transparent hover:border-border/30"
              >
                <img
                  src={user.avatar || '/images/default-avatar.png'}
                  alt={user.name}
                  className="yb-avatar w-12 h-12 border-2 border-surface shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-primary truncate">
                    {user.name}
                  </h4>
                  <p className="text-xs text-secondary font-bold">
                    @{user.username}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`yb-badge ${
                      user.status === 'active'
                        ? 'bg-success/10 text-success'
                        : 'bg-error/10 text-error'
                    }`}
                  >
                    {user.status || 'Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Posts */}
        <div className="yb-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-primary tracking-tight">
              Xu hướng nội dung
            </h3>
            <button className="p-2 hover:bg-surface-secondary rounded-xl transition-colors text-secondary">
              <ArrowUpRight size={20} />
            </button>
          </div>
          <div className="space-y-4">
            {topPosts.slice(0, 5).map((post, index) => (
              <div
                key={post._id || index}
                className="flex items-center gap-4 p-4 hover:bg-surface-secondary/50 rounded-2xl transition-all group cursor-pointer border border-transparent hover:border-border/30"
              >
                <div className="w-10 h-10 rounded-2xl bg-surface-secondary flex items-center justify-center font-black text-secondary text-sm shadow-inner group-hover:scale-110 transition-transform">
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-primary line-clamp-1 group-hover:text-accent transition-colors">
                    {post.content || post.caption || 'Nội dung không tiêu đề'}
                  </p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-secondary font-bold">
                    <span className="flex items-center gap-1">
                      <Heart size={12} /> {post.likesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {post.views}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
