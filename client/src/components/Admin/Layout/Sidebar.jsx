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
  { id: 'broadcast', icon: Send, label: 'Phát sóng' },
  { id: 'systemhealth', icon: HeartPulse, label: 'Hệ thống' },
];


const SidebarItem = ({ item, collapsed, activePage, setActivePage }) => {
  const isActive = activePage === item.id;

  return (
    <button
      type="button"
      onClick={() => setActivePage(item.id)}
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.currentTarget.blur();
        }
      }}
      className={`group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-content)]'
      } ${collapsed ? 'justify-center' : ''}`}
      title={collapsed ? item.label : undefined}
    >
      <item.icon
        size={18}
        strokeWidth={isActive ? 1.8 : 1.5}
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
    <div className="flex flex-col h-full admin-card rounded-none lg:rounded-r-3xl shadow-none">
      {/* Logo */}
      <div
        className={`flex items-center h-14 px-4 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] flex items-center justify-center">
            <Zap size={18} strokeWidth={1.6} />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-[15px] text-[var(--color-content)]">
                YiBu Admin
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                Workspace
              </span>
            </div>
          )}
        </Link>


        {mobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            onKeyDown={event => {
              if (event.key === 'Escape') {
                onCloseMobile?.();
              }
            }}
            className="p-1.5 rounded-full hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
            aria-label="Đóng menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Collapse Button - Desktop */}
      {!mobile && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            onKeyDown={event => {
              if (event.key === 'Escape') {
                event.currentTarget.blur();
              }
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors ${
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
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
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
          <div className="w-9 h-9 rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] flex items-center justify-center text-xs font-semibold">
            A
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-content)] truncate">
                  Admin
                </p>
                <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">
                  Super Admin
                </p>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-full hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] hover:text-rose-500 transition-colors"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut size={16} strokeWidth={1.6} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
