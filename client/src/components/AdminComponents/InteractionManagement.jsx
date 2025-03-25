import React, { useState, useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import AdminService from "../../services/adminService";

// Import trực tiếp từ các file riêng lẻ thay vì từ index
import InteractionList from "./InteractionManagement/InteractionList";
import InteractionStats from "./InteractionManagement/InteractionStats";
import InteractionChart from "./InteractionManagement/InteractionChart";
import SpamDetection from "./InteractionManagement/SpamDetection";
import EmptyState from "./InteractionManagement/EmptyState";
import HeaderActions from "./InteractionManagement/HeaderActions";
import SearchAndFilter from "./InteractionManagement/SearchAndFilter";
import Pagination from "./InteractionManagement/Pagination";

const InteractionManagement = () => {
  // State
  const [timeRange, setTimeRange] = useState("week");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [spamAccounts, setSpamAccounts] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [interactionTypes, setInteractionTypes] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartLabels, setChartLabels] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch interaction stats
      const statsData = await AdminService.getInteractionStats(timeRange);
      setStats(statsData.data || {});

      // Fetch interaction types
      const typesData = await AdminService.getInteractionTypes();
      setInteractionTypes(typesData.data || []);

      // Fetch spam accounts
      const spamData = await AdminService.getSpamAccounts();
      setSpamAccounts(spamData.data?.accounts || []);

      // Fetch interaction timeline data for chart
      const timelineData = await AdminService.getInteractionTimeline(
        "all",
        timeRange
      );
      setChartData(timelineData.data?.values || [65, 59, 80, 81, 56, 55, 70]);
      setChartLabels(
        timelineData.data?.labels || ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
      );

      // Fetch user interactions
      const filter = filterType !== "all" ? { type: filterType } : {};
      const interactionsData = await AdminService.getUserInteractions(
        currentPage,
        10,
        filter
      );
      setInteractions(interactionsData.data?.interactions || []);
      setTotalPages(interactionsData.data?.totalPages || 1);
    } catch (err) {
      console.error("Error fetching interaction data:", err);
      setError("Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchData();
  }, [timeRange, filterType, currentPage]);

  // Handlers
  const handleRefresh = () => {
    fetchData();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFlagAccount = async (accountId) => {
    try {
      await AdminService.flagAccount(accountId);
      setSpamAccounts(
        spamAccounts.map((account) =>
          account.id === accountId ? { ...account, isFlagged: true } : account
        )
      );
    } catch (err) {
      console.error(`Error flagging account ${accountId}:`, err);
      setError("Có lỗi xảy ra khi đánh dấu tài khoản. Vui lòng thử lại sau.");
    }
  };

  const handleRemoveInteraction = async (interactionId) => {
    try {
      await AdminService.removeInteraction(interactionId);
      setInteractions(
        interactions.filter((interaction) => interaction.id !== interactionId)
      );
    } catch (err) {
      console.error(`Error removing interaction ${interactionId}:`, err);
      setError("Có lỗi xảy ra khi xóa tương tác. Vui lòng thử lại sau.");
    }
  };

  const handleExportData = () => {
    // Implement export functionality
    console.log("Export data");
  };

  const handleViewUserDetails = (userId) => {
    // Implement view user details functionality
    console.log("View user details:", userId);
  };

  const handleBanAccount = (accountId) => {
    // Implement ban account functionality
    console.log("Ban account:", accountId);
  };

  // Filter interactions based on search term
  const filteredInteractions = interactions.filter(
    (interaction) =>
      interaction.user?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      interaction.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Quản Lý Tương Tác</h2>

        <HeaderActions
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          onRefresh={handleRefresh}
          onExport={handleExportData}
        />
      </div>

      <SearchAndFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        interactionTypes={interactionTypes}
      />

      {loading ? (
        <div className="w-full py-12 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <RefreshCw className="animate-spin text-blue-600 h-6 w-6" />
            <span className="text-gray-600">Đang tải dữ liệu...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
          {error}
        </div>
      ) : (
        <>
          {/* Interaction stats */}
          <InteractionStats stats={stats} />

          {/* Interaction charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InteractionChart
              title="Tỷ lệ tương tác theo thời gian"
              timeRange={timeRange}
              data={chartData}
              labels={chartLabels}
              chartType="bar"
            />

            <InteractionChart
              title="Phân tích tương tác người dùng"
              timeRange={timeRange}
              chartType="pie"
            />
          </div>

          {/* Potential spam accounts */}
          <SpamDetection
            accounts={spamAccounts}
            onFlag={handleFlagAccount}
            onViewDetails={handleViewUserDetails}
            onBanAccount={handleBanAccount}
          />

          {/* Recent interactions */}
          {filteredInteractions.length > 0 ? (
            <InteractionList
              interactions={filteredInteractions}
              onRemove={handleRemoveInteraction}
              onViewUser={handleViewUserDetails}
            />
          ) : (
            <EmptyState
              message={
                searchTerm
                  ? "Không tìm thấy tương tác nào khớp với tìm kiếm của bạn."
                  : "Không có dữ liệu tương tác nào. Vui lòng thử lại sau."
              }
              onRefresh={handleRefresh}
            />
          )}

          {/* Pagination */}
          {filteredInteractions.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default InteractionManagement;
