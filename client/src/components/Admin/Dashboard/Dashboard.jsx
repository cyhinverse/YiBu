import React, { useState, useEffect } from "react";
import { Users, FileText, MessageSquare, DollarSign, ArrowUp, ArrowDown } from "lucide-react";


const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    {trend !== undefined && (
      <div className="mt-4 flex items-center text-sm">
        {trend > 0 ? (
          <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
        ) : trend < 0 ? (
          <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
        ) : null}
        <span className={trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-gray-500"}>
          {Math.abs(trend)}%
        </span>
        <span className="ml-1 text-gray-500">so với tháng trước</span>
      </div>
    )}
  </div>
);

const Dashboard = () => {
  // Mock data for stats (would come from API)
  const stats = {
    users: { total: 10534, new: 156 },
    content: { posts: 4521, comments: 12430 },
    revenue: { total: 25400, growth: 15 }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng Người Dùng" 
          value={stats.users.total.toLocaleString()} 
          icon={Users} 
          color="bg-blue-500" 
          trend={12}
        />
        <StatCard 
          title="Bài Viết Mới" 
          value={stats.content.posts.toLocaleString()} 
          icon={FileText} 
          color="bg-purple-500" 
          trend={8}
        />
        <StatCard 
          title="Bình Luận" 
          value={stats.content.comments.toLocaleString()} 
          icon={MessageSquare} 
          color="bg-green-500" 
          trend={-2}
        />
        <StatCard 
          title="Doanh Thu" 
          value={`$${stats.revenue.total.toLocaleString()}`} 
          icon={DollarSign} 
          color="bg-orange-500" 
          trend={15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
           <h3 className="font-semibold text-lg mb-4">Biểu Đồ Hoạt Động</h3>
           <div className="h-64 flex items-center justify-center bg-gray-50 rounded text-gray-400">
             Coming Soon: Charts
           </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-semibold text-lg mb-4">Hoạt Động Gần Đây</h3>
           <div className="space-y-4">
             <p className="text-sm text-gray-500">Chưa có hoạt động nào.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
