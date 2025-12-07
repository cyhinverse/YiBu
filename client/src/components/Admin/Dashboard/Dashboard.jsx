import React, { useState, useEffect } from "react";
import { Users, FileText, MessageSquare, DollarSign, ArrowUp, ArrowDown } from "lucide-react";
import AdminService from "../../../services/adminService";

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
    {trend && (
      <div className="mt-4 flex items-center text-sm">
        <span className={`flex items-center ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
          {trend >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          {Math.abs(trend)}%
        </span>
        <span className="text-gray-400 ml-2">vs last month</span>
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: { total: 0, new: 0 },
    content: { posts: 0, comments: 0 },
    revenue: { total: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await AdminService.getDashboardStats("week");
        if (response && response.code === 1) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="p-4">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Tổng Quan Hệ Thống</h2>
      
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
