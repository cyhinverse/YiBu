import React, { useState } from "react";
import AdminLayout from "../../components/Admin/Layout/AdminLayout";
import Dashboard from "../../components/Admin/Dashboard/Dashboard";
import Users from "../../components/Admin/Users/Users";
import Posts from "../../components/Admin/Content/Posts";
import Comments from "../../components/Admin/Content/Comments";
import Reports from "../../components/Admin/Content/Reports";
import Interactions from "../../components/Admin/Content/Interactions";
import BannedAccounts from "../../components/Admin/Users/BannedAccounts";
import { Logs, Settings, Revenue } from "../../components/Admin/System";

const AdminPage = () => {
  const [activePage, setActivePage] = useState("dashboard");

  const renderContent = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard />;
      case "users": return <Users />;
      case "posts": return <Posts />;
      case "comments": return <Comments />;
      case "reports": return <Reports />;
      case "interactions": return <Interactions />;
      case "banned": return <BannedAccounts />;
      case "revenue": return <Revenue />;
      case "settings": return <Settings />;
      case "adminlogs": return <Logs />;
      default: return <Dashboard />;
    }
  };

  return (
    <AdminLayout activePage={activePage} setActivePage={setActivePage}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPage;
