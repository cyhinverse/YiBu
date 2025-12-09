import { useState } from "react";
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
} from "lucide-react";

// Fake stats data
const FAKE_STATS = [
  {
    id: 1,
    title: "Total Users",
    value: "12,543",
    change: "+12.5%",
    trend: "up",
    icon: Users,
    color: "bg-blue-500",
  },
  {
    id: 2,
    title: "Total Posts",
    value: "45,678",
    change: "+8.2%",
    trend: "up",
    icon: FileText,
    color: "bg-purple-500",
  },
  {
    id: 3,
    title: "Comments",
    value: "89,234",
    change: "-2.4%",
    trend: "down",
    icon: MessageSquare,
    color: "bg-green-500",
  },
  {
    id: 4,
    title: "Revenue",
    value: "$34,567",
    change: "+18.7%",
    trend: "up",
    icon: DollarSign,
    color: "bg-orange-500",
  },
];

// Fake recent users
const FAKE_RECENT_USERS = [
  {
    _id: "u1",
    name: "Sarah Chen",
    email: "sarah@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    joinedDate: "2 hours ago",
    status: "active",
  },
  {
    _id: "u2",
    name: "Mike Johnson",
    email: "mike@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    joinedDate: "5 hours ago",
    status: "active",
  },
  {
    _id: "u3",
    name: "Emma Wilson",
    email: "emma@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    joinedDate: "1 day ago",
    status: "pending",
  },
];

// Fake recent activities
const FAKE_ACTIVITIES = [
  {
    id: 1,
    type: "user",
    message: "New user registered",
    user: "John Doe",
    time: "2 min ago",
  },
  {
    id: 2,
    type: "post",
    message: "Post reported for spam",
    user: "System",
    time: "15 min ago",
  },
  {
    id: 3,
    type: "comment",
    message: "Comment flagged for review",
    user: "Moderator",
    time: "1 hour ago",
  },
  {
    id: 4,
    type: "revenue",
    message: "New subscription payment",
    user: "$29.99",
    time: "2 hours ago",
  },
  {
    id: 5,
    type: "user",
    message: "User account banned",
    user: "Admin",
    time: "3 hours ago",
  },
];

// Fake top posts
const FAKE_TOP_POSTS = [
  { id: 1, title: "How to build a React app", views: 15234, likes: 892 },
  { id: 2, title: "Best practices for UI design", views: 12456, likes: 756 },
  { id: 3, title: "Introduction to TypeScript", views: 9876, likes: 543 },
  { id: 4, title: "CSS Grid vs Flexbox", views: 8765, likes: 432 },
];

const StatCard = ({ stat }) => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
    <div className="flex items-center justify-between mb-4">
      <div
        className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}
      >
        <stat.icon size={24} className="text-white" />
      </div>
      <div
        className={`flex items-center gap-1 text-sm font-medium ${
          stat.trend === "up" ? "text-green-500" : "text-red-500"
        }`}
      >
        {stat.trend === "up" ? (
          <TrendingUp size={16} />
        ) : (
          <TrendingDown size={16} />
        )}
        {stat.change}
      </div>
    </div>
    <h3 className="text-2xl font-bold text-black dark:text-white">
      {stat.value}
    </h3>
    <p className="text-sm text-neutral-500 mt-1">{stat.title}</p>
  </div>
);

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FAKE_STATS.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
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
            {FAKE_ACTIVITIES.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-black dark:bg-white mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-black dark:text-white">
                    {activity.message}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {activity.user} · {activity.time}
                  </p>
                </div>
              </div>
            ))}
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
            {FAKE_RECENT_USERS.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-black dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-sm text-neutral-500 truncate">
                    {user.email}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === "active"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                    }`}
                  >
                    {user.status}
                  </span>
                  <p className="text-xs text-neutral-400 mt-1">
                    {user.joinedDate}
                  </p>
                </div>
              </div>
            ))}
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
            {FAKE_TOP_POSTS.map((post, index) => (
              <div
                key={post.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-medium text-neutral-500">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-black dark:text-white truncate">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-neutral-500">
                      <Eye size={12} />
                      {post.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-neutral-500">
                      <Heart size={12} />
                      {post.likes.toLocaleString()}
                    </span>
                  </div>
                </div>
                <button className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700">
                  <MoreHorizontal size={16} className="text-neutral-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
