import React, { useState, useEffect } from "react";
import {
  User,
  Users,
  FileText,
  AlertCircle,
  Ban,
  DollarSign,
  Eye,
  MessageSquare,
  ThumbsUp,
  Award,
  Calendar,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Check,
  X,
  Flag,
  Clock,
  ArrowRight,
  RefreshCw,
  Download,
  Search,
  Filter,
  Printer,
  BellRing,
  ShieldAlert,
  Bell,
} from "lucide-react";
import AdminService from "../../services/adminService";

// We'll simulate chart data for now - in a real app, this would come from API
const AdminDashboard = () => {
  const [timeRange, setTimeRange] = useState("week");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterReportStatus, setFilterReportStatus] = useState("all");
  const [showNotifications, setShowNotifications] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    statsData: {
      users: { total: 0, new: 0, active: 0, banned: 0 },
      content: { posts: 0, comments: 0, reports: 0 },
      engagement: { likes: 0, shares: 0 },
      revenue: { total: 0, premium: 0, ads: 0 },
      userActivity: { data: [], trend: 0 },
      contentDistribution: null,
      revenueTrend: 0,
    },
    recentActivities: [],
    recentReports: [],
    systemAlerts: [],
  });

  // Fetch dashboard data on component mount and when time range changes
  useEffect(() => {
    fetchDashboardData();
    fetchSystemAlerts();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch stats data
      const statsResponse = await AdminService.getDashboardStats(timeRange);

      // Fetch recent activities
      const activitiesResponse = await AdminService.getRecentActivities(10);

      if (statsResponse && statsResponse.code === 1) {
        setDashboardData((prevData) => ({
          ...prevData,
          statsData: {
            ...prevData.statsData,
            users: statsResponse.data.users || prevData.statsData.users,
            content: statsResponse.data.content || prevData.statsData.content,
            engagement:
              statsResponse.data.engagement || prevData.statsData.engagement,
            revenue: statsResponse.data.revenue || prevData.statsData.revenue,
            userActivity:
              statsResponse.data.userActivity ||
              prevData.statsData.userActivity,
            contentDistribution:
              statsResponse.data.contentDistribution ||
              prevData.statsData.contentDistribution,
            revenueTrend: statsResponse.data.revenueTrend || 0,
          },
        }));
      }

      if (activitiesResponse && activitiesResponse.code === 1) {
        setDashboardData((prevData) => ({
          ...prevData,
          recentActivities: Array.isArray(activitiesResponse.data)
            ? activitiesResponse.data
            : [],
        }));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSystemAlerts = async () => {
    try {
      // Mock data thay vì gọi API không tồn tại
      const mockAlerts = {
        code: 1,
        data: [
          {
            id: 1,
            type: "warning",
            message: "Phát hiện hoạt động đáng ngờ",
            time: "2 giờ trước",
            read: false,
          },
          {
            id: 2,
            type: "error",
            message: "Lỗi kết nối cơ sở dữ liệu",
            time: "5 giờ trước",
            read: true,
          },
          {
            id: 3,
            type: "info",
            message: "Cập nhật hệ thống hoàn tất",
            time: "1 ngày trước",
            read: false,
          },
        ],
      };

      setDashboardData((prevData) => ({
        ...prevData,
        systemAlerts: mockAlerts.data,
      }));
    } catch (error) {
      console.error("Error fetching system alerts:", error);
    }
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  // Update the handleTimeRangeChange function to use API data instead of simulating with setTimeout
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    fetchDashboardData(); // This will fetch real data using the new time range
  };

  // Thêm chức năng xử lý báo cáo
  const handleReportAction = (reportId, action) => {
    setDashboardData((prev) => ({
      ...prev,
      recentReports: prev.recentReports.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status: action === "resolve" ? "resolved" : "rejected",
            }
          : report
      ),
    }));
  };

  // Helper functions for report type and status
  const getReportTypeStyle = (type) => {
    switch (type) {
      case "post":
        return "bg-blue-100 text-blue-800";
      case "comment":
        return "bg-green-100 text-green-800";
      case "user":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getReportTypeLabel = (type) => {
    switch (type) {
      case "post":
        return "Bài viết";
      case "comment":
        return "Bình luận";
      case "user":
        return "Người dùng";
      default:
        return "Khác";
    }
  };

  const getReportStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  const getReportStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "resolved":
        return "Đã xử lý";
      default:
        return "Từ chối";
    }
  };

  // Xuất báo cáo thống kê dưới dạng CSV
  const exportStats = () => {
    // Trong ứng dụng thực tế, bạn sẽ cần tạo nội dung CSV phức tạp hơn
    const today = new Date().toISOString().slice(0, 10);
    const csvContent = `
Báo cáo thống kê ${
      timeRange === "day" ? "ngày" : timeRange === "week" ? "tuần" : "tháng"
    } - ${today}

THỐNG KÊ NGƯỜI DÙNG
Tổng người dùng: ${dashboardData.statsData.users.total || 0}
Người dùng mới: ${dashboardData.statsData.users.new || 0}
Người dùng hoạt động: ${dashboardData.statsData.users.active || 0}
Người dùng bị cấm: ${dashboardData.statsData.users.banned || 0}

THỐNG KÊ NỘI DUNG
Tổng bài viết: ${dashboardData.statsData.content.posts || 0}
Tổng bình luận: ${dashboardData.statsData.content.comments || 0}
Báo cáo: ${dashboardData.statsData.content.reports || 0}

THỐNG KÊ TƯƠNG TÁC
Lượt thích: ${dashboardData.statsData.engagement.likes || 0}
Lượt chia sẻ: ${dashboardData.statsData.engagement.shares || 0}

THỐNG KÊ DOANH THU
Tổng doanh thu: ${(
      dashboardData.statsData.revenue.total || 0
    ).toLocaleString()} VNĐ
Doanh thu Premium: ${(
      dashboardData.statsData.revenue.premium || 0
    ).toLocaleString()} VNĐ
Doanh thu quảng cáo: ${(
      dashboardData.statsData.revenue.ads || 0
    ).toLocaleString()} VNĐ
`;

    // Tạo một Blob chứa nội dung CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Tạo liên kết tải xuống và kích hoạt nó
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `bao-cao-thong-ke-${timeRange}-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Xuất báo cáo dưới dạng PDF (giả lập - trong thực tế bạn sẽ sử dụng thư viện như jsPDF)
  const printReport = () => {
    // Trong ứng dụng thực tế, bạn có thể sử dụng thư viện như jsPDF hoặc react-to-pdf
    window.print();
  };

  // Lọc hoạt động dựa trên chuỗi tìm kiếm
  const filteredActivities = dashboardData.recentActivities.filter(
    (activity) =>
      (activity.user &&
        activity.user.name &&
        activity.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (activity.action &&
        activity.action.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Lọc báo cáo dựa trên trạng thái
  const filteredReports = dashboardData.recentReports.filter(
    (report) =>
      filterReportStatus === "all" || report.status === filterReportStatus
  );

  // Đánh dấu thông báo là đã đọc
  const markNotificationAsRead = (notificationId) => {
    setDashboardData((prev) => ({
      ...prev,
      systemAlerts: prev.systemAlerts.map((alert) =>
        alert.id === notificationId ? { ...alert, read: true } : alert
      ),
    }));
  };

  // Đếm số thông báo chưa đọc
  const unreadNotificationsCount = dashboardData.systemAlerts.filter(
    (alert) => !alert.read
  ).length;

  // Helper functions for the content distribution chart
  const getBorderColor = (index) => {
    const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];
    return colors[index % colors.length];
  };

  const getPointX = (angle) => {
    return 50 + 50 * Math.cos((angle * Math.PI) / 180);
  };

  const getPointY = (angle) => {
    return 50 + 50 * Math.sin((angle * Math.PI) / 180);
  };

  const getClipPathPoints = (startAngle, endAngle) => {
    // For segments spanning more than 90 degrees, we need intermediate points
    const points = [];
    const step = 10;
    for (let angle = startAngle + step; angle < endAngle; angle += step) {
      points.push(`${getPointX(angle)}% ${getPointY(angle)}%`);
    }
    return points.join(", ");
  };

  // Fetch reports data
  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Mock data thay vì gọi API không tồn tại
        const mockReports = {
          code: 1,
          data: [
            {
              id: 1,
              type: "post",
              reporterId: "user123",
              reporterName: "Nguyễn Văn A",
              targetId: "post456",
              targetTitle: "Bài viết vi phạm",
              reason: "Nội dung không phù hợp",
              status: "pending",
              createdAt: "2023-06-15T08:30:00Z",
            },
            {
              id: 2,
              type: "comment",
              reporterId: "user789",
              reporterName: "Trần Thị B",
              targetId: "comment123",
              targetTitle: "Bình luận xúc phạm",
              reason: "Ngôn từ không phù hợp",
              status: "resolved",
              createdAt: "2023-06-14T15:45:00Z",
            },
            {
              id: 3,
              type: "user",
              reporterId: "user456",
              reporterName: "Lê Văn C",
              targetId: "user999",
              targetTitle: "Người dùng spam",
              reason: "Spam liên tục",
              status: "rejected",
              createdAt: "2023-06-13T10:20:00Z",
            },
          ],
        };

        setDashboardData((prevData) => ({
          ...prevData,
          recentReports: mockReports.data,
        }));
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800">Tổng Quan</h2>

        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <div className="relative">
            <button
              className="p-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={18} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
                <div className="py-2 px-3 bg-gray-100 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Thông báo hệ thống
                    </h3>
                    <button className="text-xs text-blue-600 hover:text-blue-800">
                      Đánh dấu tất cả đã đọc
                    </button>
                  </div>
                </div>
                <div className="py-2 max-h-60 overflow-y-auto">
                  {dashboardData.systemAlerts.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      Không có thông báo
                    </p>
                  ) : (
                    dashboardData.systemAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                          !alert.read ? "bg-blue-50" : ""
                        }`}
                        onClick={() => markNotificationAsRead(alert.id)}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            {alert.type === "warning" && (
                              <AlertTriangle
                                size={16}
                                className="text-yellow-500"
                              />
                            )}
                            {alert.type === "error" && (
                              <ShieldAlert size={16} className="text-red-500" />
                            )}
                            {alert.type === "info" && (
                              <BellRing size={16} className="text-blue-500" />
                            )}
                          </div>
                          <div className="ml-3 w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {alert.message}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {alert.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="py-2 px-3 bg-gray-100 text-xs text-center">
                  <a href="#" className="text-blue-600 hover:text-blue-800">
                    Xem tất cả thông báo
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="inline-flex rounded-md shadow-sm">
            {["day", "week", "month"].map((range) => (
              <button
                key={range}
                type="button"
                className={`px-3 py-2 text-sm font-medium ${
                  timeRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } ${
                  range === "day"
                    ? "rounded-l-md"
                    : range === "month"
                    ? "rounded-r-md"
                    : ""
                } border border-gray-300`}
                onClick={() => handleTimeRangeChange(range)}
              >
                {range === "day" && "Hôm nay"}
                {range === "week" && "Tuần này"}
                {range === "month" && "Tháng này"}
              </button>
            ))}
          </div>

          <button
            className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>

          <button
            className="p-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
            onClick={exportStats}
            title="Xuất báo cáo CSV"
          >
            <Download size={18} />
          </button>

          <button
            className="p-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            onClick={printReport}
            title="In báo cáo"
          >
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* Tổng quan doanh thu */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Tổng quan doanh thu
          </h3>
        </div>

        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <DollarSign size={20} className="text-green-500 mr-2" />
                <h4 className="text-lg font-medium text-gray-900">
                  Doanh thu theo thời gian
                </h4>
              </div>

              {/* Revenue chart using real data */}
              <div className="h-64 flex items-end space-x-2">
                {(
                  dashboardData.statsData.revenue.chart || Array(12).fill(0)
                ).map((value, index) => {
                  // Convert to percentage of max value for display
                  const maxValue = Math.max(
                    ...(dashboardData.statsData.revenue.chart || [1])
                  );
                  const height = maxValue ? (value / maxValue) * 100 : 0;

                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className="w-full bg-green-500 hover:bg-green-600 rounded-t transition-all duration-200"
                        style={{ height: `${height}%` }}
                      ></div>
                      {index % 2 === 0 && (
                        <span className="text-xs text-gray-500 mt-1">
                          {(dashboardData.statsData.revenue.labels &&
                            dashboardData.statsData.revenue.labels[index]) ||
                            `T${index + 1}`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  <span className="font-medium text-gray-900">
                    {(
                      dashboardData.statsData.revenue.total || 0
                    ).toLocaleString()}
                  </span>{" "}
                  VNĐ tổng doanh thu
                </div>
                <div className="text-sm text-green-600 flex items-center">
                  {dashboardData.statsData.revenueTrend >= 0 ? (
                    <>
                      <TrendingUp size={16} className="mr-1" />
                      <span>
                        Tăng {dashboardData.statsData.revenueTrend}% so với kỳ
                        trước
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown size={16} className="mr-1 text-red-600" />
                      <span className="text-red-600">
                        Giảm {Math.abs(dashboardData.statsData.revenueTrend)}%
                        so với kỳ trước
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center mb-4">
                <Activity size={20} className="text-blue-500 mr-2" />
                <h4 className="text-lg font-medium text-gray-900">
                  Phân tích doanh thu
                </h4>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      Premium
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round(
                        ((dashboardData.statsData.revenue.premium || 0) /
                          (dashboardData.statsData.revenue.total || 1)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{
                        width: `${
                          ((dashboardData.statsData.revenue.premium || 0) /
                            (dashboardData.statsData.revenue.total || 1)) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      Quảng cáo
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round(
                        ((dashboardData.statsData.revenue.ads || 0) /
                          (dashboardData.statsData.revenue.total || 1)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-purple-600 h-2.5 rounded-full"
                      style={{
                        width: `${
                          ((dashboardData.statsData.revenue.ads || 0) /
                            (dashboardData.statsData.revenue.total || 1)) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-500 mb-1">
                      Doanh thu Premium
                    </p>
                    <p className="text-lg font-semibold">
                      {(
                        dashboardData.statsData.revenue.premium || 0
                      ).toLocaleString()}{" "}
                      VNĐ
                    </p>
                    <div className="mt-1 text-xs text-green-600 flex items-center">
                      {dashboardData.statsData.revenue.premiumTrend >= 0 ? (
                        <>
                          <TrendingUp size={12} className="mr-1" />
                          <span>
                            +{dashboardData.statsData.revenue.premiumTrend || 0}
                            %
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown
                            size={12}
                            className="mr-1 text-red-600"
                          />
                          <span className="text-red-600">
                            {dashboardData.statsData.revenue.premiumTrend || 0}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-500 mb-1">
                      Doanh thu Quảng cáo
                    </p>
                    <p className="text-lg font-semibold">
                      {(
                        dashboardData.statsData.revenue.ads || 0
                      ).toLocaleString()}{" "}
                      VNĐ
                    </p>
                    <div className="mt-1 text-xs text-green-600 flex items-center">
                      {dashboardData.statsData.revenue.adsTrend >= 0 ? (
                        <>
                          <TrendingUp size={12} className="mr-1" />
                          <span>
                            +{dashboardData.statsData.revenue.adsTrend || 0}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown
                            size={12}
                            className="mr-1 text-red-600"
                          />
                          <span className="text-red-600">
                            {dashboardData.statsData.revenue.adsTrend || 0}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Người dùng"
          value={dashboardData.statsData.users.total || 0}
          change={dashboardData.statsData.users.trend || 0}
          isPositive={dashboardData.statsData.users.trend >= 0}
          icon={<Users className="text-blue-500" />}
          details={[
            { label: "Mới", value: dashboardData.statsData.users.new || 0 },
            {
              label: "Active",
              value: dashboardData.statsData.users.active || 0,
            },
          ]}
        />
        <StatCard
          title="Bài viết"
          value={dashboardData.statsData.content.posts || 0}
          change={dashboardData.statsData.content.postsTrend || 0}
          isPositive={dashboardData.statsData.content.postsTrend >= 0}
          icon={<FileText className="text-green-500" />}
          details={[
            {
              label: "Mới",
              value: dashboardData.statsData.content.newPosts || 0,
            },
            {
              label: "Chờ duyệt",
              value: dashboardData.statsData.content.pendingPosts || 0,
            },
          ]}
        />
        <StatCard
          title="Bình luận"
          value={dashboardData.statsData.content.comments || 0}
          change={dashboardData.statsData.content.commentsTrend || 0}
          isPositive={dashboardData.statsData.content.commentsTrend >= 0}
          icon={<MessageSquare className="text-purple-500" />}
          details={[
            {
              label: "Mới",
              value: dashboardData.statsData.content.newComments || 0,
            },
            {
              label: "Chờ duyệt",
              value: dashboardData.statsData.content.pendingComments || 0,
            },
          ]}
        />
        <StatCard
          title="Báo cáo"
          value={dashboardData.statsData.content.reports || 0}
          change={dashboardData.statsData.content.reportsTrend || 0}
          isPositive={dashboardData.statsData.content.reportsTrend >= 0}
          icon={<AlertTriangle className="text-red-500" />}
          details={[
            {
              label: "Mới",
              value: dashboardData.statsData.content.newReports || 0,
            },
            {
              label: "Đang xử lý",
              value: dashboardData.statsData.content.pendingReports || 0,
            },
          ]}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Chart */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Hoạt động người dùng
            </h3>
            <div className="text-sm text-gray-500 flex items-center">
              {dashboardData.statsData.userActivity &&
              dashboardData.statsData.userActivity.trend > 0 ? (
                <>
                  <TrendingUp className="text-green-500 mr-1" size={16} />
                  <span>
                    Tăng {dashboardData.statsData.userActivity?.trend || 0}% so
                    với {timeRange} trước
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="text-red-500 mr-1" size={16} />
                  <span>
                    Giảm{" "}
                    {Math.abs(dashboardData.statsData.userActivity?.trend || 0)}
                    % so với {timeRange} trước
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Chart simulation - replace with real chart data when available */}
          <div className="h-64 flex items-end space-x-2">
            {(
              dashboardData.statsData.userActivity?.data || Array(14).fill(0)
            ).map((value, index) => {
              // Convert to percentage of max value for display
              const maxValue = Math.max(
                ...(dashboardData.statsData.userActivity?.data || [1])
              );
              const height = maxValue ? (value / maxValue) * 100 : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-all duration-200"
                    style={{ height: `${height}%` }}
                  ></div>
                  {index % 2 === 0 && (
                    <span className="text-xs text-gray-500 mt-1">
                      {index + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Hoạt động theo ngày</span>
            </div>
            <button className="text-sm text-blue-600 font-medium flex items-center">
              Xem chi tiết
              <ArrowRight size={14} className="ml-1" />
            </button>
          </div>
        </div>

        {/* Content Distribution Chart */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Phân bố nội dung
            </h3>
            <div className="text-sm text-gray-500">
              Tổng: {dashboardData.statsData.content.posts || 0} bài viết
            </div>
          </div>

          {/* Chart simulation - donut chart for content types */}
          <div className="h-64 flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* Use real data from the API for content distribution */}
              {dashboardData.statsData.contentDistribution &&
                Object.entries(dashboardData.statsData.contentDistribution).map(
                  ([type, data], index) => {
                    // Calculate clip path based on percentage
                    const startAngle =
                      index > 0
                        ? Object.entries(
                            dashboardData.statsData.contentDistribution
                          )
                            .slice(0, index)
                            .reduce(
                              (sum, [_, item]) => sum + item.percentage,
                              0
                            ) * 3.6
                        : 0;
                    const endAngle = startAngle + data.percentage * 3.6;

                    return (
                      <div
                        key={type}
                        className={`absolute inset-0 rounded-full border-[24px]`}
                        style={{
                          borderColor: data.color || getBorderColor(index),
                          clipPath: `polygon(50% 50%, ${getPointX(
                            startAngle
                          )}% ${getPointY(startAngle)}%, ${getClipPathPoints(
                            startAngle,
                            endAngle
                          )}, ${getPointX(endAngle)}% ${getPointY(endAngle)}%)`,
                        }}
                      ></div>
                    );
                  }
                )}

              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-white rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-900 text-lg font-bold">
                    {dashboardData.statsData.content.posts || 0}
                  </div>
                  <div className="text-gray-500 text-xs">Tổng bài viết</div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {dashboardData.statsData.contentDistribution ? (
              Object.entries(dashboardData.statsData.contentDistribution).map(
                ([type, data], index) => (
                  <div key={type} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{
                        backgroundColor: data.color || getBorderColor(index),
                      }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      {data.label} ({data.percentage}%)
                    </span>
                  </div>
                )
              )
            ) : (
              <>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Bài viết (0%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Ảnh (0%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Video (0%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Khác (0%)</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity and Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Hoạt động gần đây
            </h3>

            <div className="flex items-center w-full sm:w-auto">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Tìm kiếm hoạt động..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Người dùng
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Hoạt động
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell"
                  >
                    Thời gian
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {activity.user && activity.user.avatar ? (
                          <img
                            className="h-8 w-8 rounded-full object-cover"
                            src={activity.user.avatar}
                            alt={activity.user.name || "User"}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <User size={14} className="text-gray-500" />
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {activity.user
                              ? activity.user.name || "Unnamed User"
                              : "Unknown User"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {activity.action || "No action recorded"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock size={12} className="mr-1 text-gray-400" />
                        {activity.time || "Unknown time"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Reports Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Báo cáo gần đây
            </h3>

            <div className="flex items-center space-x-2">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filterReportStatus}
                onChange={(e) => setFilterReportStatus(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="resolved">Đã xử lý</option>
                <option value="rejected">Đã từ chối</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Loại
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Nội dung
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Trạng thái
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getReportTypeStyle(
                          report.type
                        )}`}
                      >
                        {getReportTypeLabel(report.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 truncate max-w-[200px]">
                        {report.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getReportStatusStyle(
                          report.status
                        )}`}
                      >
                        {getReportStatusLabel(report.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-1">
                        <button className="text-blue-600 hover:text-blue-900 p-1">
                          <Eye size={16} />
                        </button>
                        {report.status === "pending" && (
                          <>
                            <button
                              className="text-green-600 hover:text-green-900 p-1"
                              onClick={() =>
                                handleReportAction(report.id, "resolve")
                              }
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900 p-1"
                              onClick={() =>
                                handleReportAction(report.id, "reject")
                              }
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change, isPositive, icon, details }) => {
  const isPositiveChange = change >= 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-gray-500 text-sm mb-1">{title}</h3>
          <div className="text-2xl font-bold text-gray-900">
            {(value || 0).toLocaleString()}
          </div>
          <div
            className={`text-sm flex items-center mt-1 ${
              isPositiveChange ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositiveChange ? (
              <TrendingUp size={14} className="mr-1" />
            ) : (
              <TrendingDown size={14} className="mr-1" />
            )}
            <span>
              {isPositiveChange ? "+" : ""}
              {change}%
            </span>
          </div>
        </div>
        <div className="p-3 bg-gray-100 rounded-full">{icon}</div>
      </div>

      {details && (
        <div className="mt-4 grid grid-cols-2 gap-2 pt-4 border-t border-gray-100">
          {details.map((detail, idx) => (
            <div key={idx}>
              <p className="text-xs text-gray-500">{detail.label}</p>
              <p className="text-sm font-semibold">
                {(detail.value || 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
