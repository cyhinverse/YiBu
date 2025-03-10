import AdminContent from "../../components/AdminComponents/AdminContent";
import AdminSidebar from "../../components/AdminComponents/AdminSidebar";
import AdminHeader from "../../components/AdminComponents/AdminHeader";

const AdminPage = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <AdminSidebar />
      <div className="flex-1">
        <AdminHeader />
        <AdminContent />
      </div>
    </div>
  );
};

export default AdminPage;
