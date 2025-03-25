import { useState } from "react";
import AdminSidebar from "../../components/AdminComponents/AdminSidebar";
import AdminHeader from "../../components/AdminComponents/AdminHeader";
import AdminDashboard from "../../components/AdminComponents/AdminDashboard";
import UserManagement from "../../components/AdminComponents/UserManagement";
import PostManagement from "../../components/AdminComponents/PostManagement";
import CommentManagement from "../../components/AdminComponents/CommentManagement";
import ReportManagement from "../../components/AdminComponents/ReportManagement";
import InteractionManagement from "../../components/AdminComponents/InteractionManagement";
import BannedAccounts from "../../components/AdminComponents/BannedAccounts";
import RevenueManagement from "../../components/AdminComponents/RevenueManagement";
import AdminSettings from "../../components/AdminComponents/AdminSettings";
import AdminLogs from "../../components/AdminComponents/AdminLogs";

const AdminPage = () => {
  const [activePage, setActivePage] = useState("dashboard");

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <AdminDashboard />;
      case "users":
        return <UserManagement />;
      case "posts":
        return <PostManagement />;
      case "comments":
        return <CommentManagement />;
      case "reports":
        return <ReportManagement />;
      case "interactions":
        return <InteractionManagement />;
      case "banned":
        return <BannedAccounts />;
      case "revenue":
        return <RevenueManagement />;
      case "settings":
        return <AdminSettings />;
      case "adminlogs":
        return <AdminLogs />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <AdminSidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 flex flex-col">
        <AdminHeader activePage={activePage} />
        <main className="p-4 flex-1 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminPage;
