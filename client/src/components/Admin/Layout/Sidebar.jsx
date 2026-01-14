import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Flag,
  Activity,
  UserX,
  Send,
  HeartPulse,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { id: 'users', icon: Users, label: 'Người dùng' },
  { id: 'posts', icon: FileText, label: 'Bài viết' },
  { id: 'comments', icon: MessageSquare, label: 'Bình luận' },
  { id: 'reports', icon: Flag, label: 'Báo cáo', badge: 5 },
  { id: 'interactions', icon: Activity, label: 'Tương tác' },
  { id: 'banned', icon: UserX, label: 'Bị chặn' },
  { id: 'broadcast', icon: Send, label: 'Thông báo' },
  { id: 'systemhealth', icon: HeartPulse, label: 'Hệ thống' },
];

const SidebarItem = ({ item, collapsed, activePage, setActivePage }) => {
  const isActive = activePage === item.id;

  return (
    <button
      onClick={() => setActivePage(item.id)}
      className={`group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white'
      } ${collapsed ? 'justify-center' : ''}`}
      title={collapsed ? item.label : undefined}
    >
      <item.icon
        size={18}
        strokeWidth={isActive ? 2 : 1.5}
        className="flex-shrink-0"
      />

      {!collapsed && (
        <span className="text-[13px] font-medium truncate">{item.label}</span>
      )}

      {item.badge > 0 && !collapsed && (
        <span className="ml-auto text-[10px] font-semibold bg-rose-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {item.badge}
        </span>
      )}

      {item.badge > 0 && collapsed && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full" />
      )}
    </button>
  );
};

export default function Sidebar({
  activePage,
  setActivePage,
  sidebarOpen,
  setSidebarOpen,
  mobile = false,
  onCloseMobile,
}) {
  const collapsed = !sidebarOpen && !mobile;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 shadow-sm">
      {/* Logo */}
      <div
        className={`flex items-center h-14 px-4 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center">
            <Zap
              size={16}
              className="text-white dark:text-neutral-900"
              strokeWidth={2}
            />
          </div>
          {!collapsed && (
            <span className="font-semibold text-[15px] text-neutral-800 dark:text-white">
              Admin
            </span>
          )}
        </Link>

        {mobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Collapse Button - Desktop */}
      {!mobile && (
        <div className="px-3 py-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            {collapsed ? (
              <ChevronRight size={14} />
            ) : (
              <>
                <ChevronLeft size={14} />
                <span>Thu gọn</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {menuItems.map(item => (
          <SidebarItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            activePage={activePage}
            setActivePage={id => {
              setActivePage(id);
              if (mobile && onCloseMobile) onCloseMobile();
            }}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3">
        <div
          className={`flex items-center gap-3 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
            A
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 dark:text-white truncate">
                  Admin
                </p>
                <p className="text-[11px] text-neutral-500 truncate">
                  Super Admin
                </p>
              </div>
              <button
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-rose-500 transition-colors"
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
