import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Flag,
  Activity,
  UserX,
  DollarSign,
  Settings,
  ScrollText,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../../redux/actions/authActions";

const AdminLayout = ({ children, activePage, setActivePage }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const menuItems = [
    { id: "dashboard", icon: <LayoutDashboard size={20} />, label: "Tổng Quan" },
    { id: "users", icon: <Users size={20} />, label: "Người Dùng" },
    { id: "posts", icon: <FileText size={20} />, label: "Bài Viết" },
    { id: "comments", icon: <MessageSquare size={20} />, label: "Bình Luận" },
    { id: "reports", icon: <Flag size={20} />, label: "Báo Cáo" },
    { id: "interactions", icon: <Activity size={20} />, label: "Tương Tác" },
    { id: "banned", icon: <UserX size={20} />, label: "Cấm" },
    { id: "revenue", icon: <DollarSign size={20} />, label: "Doanh Thu" },
    { id: "settings", icon: <Settings size={20} />, label: "Cài Đặt" },
    { id: "adminlogs", icon: <ScrollText size={20} />, label: "Logs" },
  ];

  const handleLogout = () => {
    dispatch(logout(navigate));
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white shadow-xl">
      <div className="p-6 flex items-center justify-center border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
          Admin
        </h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  setActivePage(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activePage === item.id
                    ? "bg-blue-600 text-white shadow-md font-medium"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
        >
          <LogOut size={18} />
          <span>Đăng Xuất</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-full">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 h-full shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0">
             <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className="font-semibold text-gray-800">
            {menuItems.find(i => i.id === activePage)?.label || "Admin"}
          </span>
          <div className="w-8"></div> {/* Spacer for center alignment */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
           <div className="max-w-7xl mx-auto">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
