import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Users,
  FileText,
  MessageSquare,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  Share2,
  ArrowUpRight,
  MoreHorizontal,
  Loader2,
  RefreshCcw,
} from 'lucide-react';
import {
  getDashboardStats,
  getUserGrowth,
  getPostStats,
  getTopUsers,
} from '../../../redux/actions/adminActions';

// Default stats for fallback
const DEFAULT_STATS = [
  {
    id: 1,
    title: 'Total Users',
    value: '0',
    change: '+0%',
    trend: 'up',
    icon: Users,
    color: 'bg-blue-500',
    key: 'totalUsers',
  },
  {
    id: 2,
    title: 'Total Posts',
    value: '0',
    change: '+0%',
    trend: 'up',
    icon: FileText,
    color: 'bg-purple-500',
    key: 'totalPosts',
  },
  {
    id: 3,
    title: 'Comments',
    value: '0',
    change: '+0%',
    trend: 'up',
    icon: MessageSquare,
    color: 'bg-green-500',
    key: 'totalComments',
  },
  {
    id: 4,
    title: 'Active Users',
    value: '0',
    change: '+0%',
    trend: 'up',
    icon: Users,
    color: 'bg-orange-500',
    key: 'activeUsers',
  },
];

const StatCard = ({ stat, isLoading }) => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
    <div className="flex items-center justify-between mb-4">
      <div
        className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}
      >
        <stat.icon size={24} className="text-white" />
      </div>
      {!isLoading && (
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
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
    {isLoading ? (
      <div className="h-8 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
    ) : (
      <h3 className="text-2xl font-bold text-black dark:text-white">
        {stat.value}
      </h3>
    )}
    <p className="text-sm text-neutral-500 mt-1">{stat.title}</p>
  </div>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { stats, topUsers, loading } = useSelector(state => state.admin);
  const [period, setPeriod] = useState('week');

  // Fetch data on mount
  useEffect(() => {
    dispatch(getDashboardStats());
    dispatch(getTopUsers({ limit: 10 }));
  }, [dispatch]);

  // Build stats from API response
  const buildStats = () => {
    if (!stats) return DEFAULT_STATS;

    // Use optional chaining carefully since stats structure is nested: { users: {...}, posts: {...} }
    const userStats = stats.users || {};
    const postStats = stats.posts || {};
    // Calculate comments stats if available, or allow them to be flat if API changes. 
    // Currently Service doesn't return comments count in getDashboardStats explicitly in the "top level" object I saw in Step 217 
    // (It returns users, posts, reports). 
    // Wait, let me check Admin.Service.js getDashboardStats in Step 217.
    // It returns: users, posts, reports. NO comments!
    // So 'totalComments' will be 0 unless I update Service or remove it.
    // However, I can't easily update Service's getDashboardStats query quickly without adding another Promise. 
    // Let's just map what we have.
    
    return [
      {
        id: 1,
        title: 'Total Users',
        value: (userStats.total || 0).toLocaleString(),
        change: `+${userStats.newThisWeek || 0}`,
        trend: 'up',
        icon: Users,
        color: 'bg-blue-500',
      },
      {
        id: 2,
        title: 'Total Posts',
        value: (postStats.total || 0).toLocaleString(),
        change: `+${postStats.thisWeek || 0}`,
        trend: 'up',
        icon: FileText,
        color: 'bg-purple-500',
      },
      {
        id: 3,
        title: 'Pending Reports', // Changed from Comments since we have Reports data
        value: (stats.reports?.pending || 0).toLocaleString(),
        change: `${stats.reports?.total || 0} total`,
        trend: 'up',
        icon: MessageSquare,
        color: 'bg-yellow-500', // Changed color to indicate attention
      },
      {
        id: 4,
        title: 'Active Users',
        value: (userStats.active || 0).toLocaleString(),
        change: 'This Week',
        trend: 'up',
        icon: Users,
        color: 'bg-orange-500',
      },
    ];
  };

  // Get recent activities from stats
  const activities = stats?.recentActivities || [];
  const recentUsers = stats?.recentUsers || [];
  const topPosts = stats?.topPosts || [];

  const handleRefresh = () => {
    dispatch(getDashboardStats());
    dispatch(getTopUsers({ limit: 10 }));
  };
  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">
            Dashboard
          </h2>
          <p className="text-sm text-neutral-500 mt-1">Welcome back, Admin</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {buildStats().map(stat => (
          <StatCard key={stat.id} stat={stat} isLoading={loading && !stats} />
        ))}
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart Placeholder */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-black dark:text-white">
              Activity Overview
            </h3>
            <select className="px-3 py-1.5 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white border-0 focus:ring-2 focus:ring-neutral-300">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          {/* Chart Placeholder */}
          <div className="h-64 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <div className="text-center text-neutral-400">
              <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
              <p>Chart visualization here</p>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-black dark:text-white">
              Recent Activity
            </h3>
            <button className="text-sm text-neutral-500 hover:text-black dark:hover:text-white">
              View all
            </button>
          </div>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">
                No recent activities
              </p>
            ) : (
              activities.slice(0, 5).map((activity, index) => (
                <div
                  key={activity._id || index}
                  className="flex items-start gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-black dark:bg-white mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-black dark:text-white">
                      {activity.message || activity.action}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {activity.user?.name || 'System'} ·{' '}
                      {activity.createdAt
                        ? new Date(activity.createdAt).toLocaleString()
                        : 'Just now'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-black dark:text-white">
              New Users
            </h3>
            <button className="flex items-center gap-1 text-sm text-neutral-500 hover:text-black dark:hover:text-white">
              View all
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">
                No recent users
              </p>
            ) : (
              recentUsers.slice(0, 5).map(user => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <img
                    src={user.avatar || '/images/default-avatar.png'}
                    alt={user.name || user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-black dark:text-white truncate">
                      {user.name || user.username}
                    </p>
                    <p className="text-sm text-neutral-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : user.status === 'banned'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                      }`}
                    >
                      {user.status || 'active'}
                    </span>
                    <p className="text-xs text-neutral-400 mt-1">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : 'Recently'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Posts */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-black dark:text-white">
              Top Posts
            </h3>
            <button className="flex items-center gap-1 text-sm text-neutral-500 hover:text-black dark:hover:text-white">
              View all
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {topPosts.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">
                No top posts
              </p>
            ) : (
              topPosts.slice(0, 5).map((post, index) => (
                <div
                  key={post._id || index}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-medium text-neutral-500">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-black dark:text-white truncate">
                      {post.caption || post.content || 'Untitled Post'}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <Eye size={12} />
                        {(post.views || 0).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <Heart size={12} />
                        {(post.likesCount || post.likes || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700">
                    <MoreHorizontal size={16} className="text-neutral-400" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
