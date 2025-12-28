import React from 'react';
import { NavLink, Link } from 'react-router-dom';
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
  Send,
  HeartPulse,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

const menuItems = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/admin',
  },
  { id: 'users', icon: Users, label: 'Users', path: '/admin/users' },
  { id: 'posts', icon: FileText, label: 'Posts', path: '/admin/posts' },
  {
    id: 'comments',
    icon: MessageSquare,
    label: 'Comments',
    path: '/admin/comments',
  },
  {
    id: 'reports',
    icon: Flag,
    label: 'Reports',
    path: '/admin/reports',
    badge: 5,
  },
  {
    id: 'interactions',
    icon: Activity,
    label: 'Interactions',
    path: '/admin/interactions',
  },
  { id: 'banned', icon: UserX, label: 'Banned Users', path: '/admin/banned' },
  { id: 'revenue', icon: DollarSign, label: 'Revenue', path: '/admin/revenue' },
  { id: 'broadcast', icon: Send, label: 'Broadcast', path: '/admin/broadcast' },
  {
    id: 'systemhealth',
    icon: HeartPulse,
    label: 'System Health',
    path: '/admin/systemhealth',
  },
  {
    id: 'adminlogs',
    icon: ScrollText,
    label: 'Activity Logs',
    path: '/admin/logs',
  },
  {
    id: 'settings',
    icon: Settings,
    label: 'Settings',
    path: '/admin/settings',
  },
];

const SidebarItem = ({ item, collapsed, activePage, setActivePage }) => {
  const isActive = activePage === item.id;

  return (
    <button
      onClick={() => setActivePage(item.id)}
      className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all w-full duration-200 ease-in-out ${
        isActive
          ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-semibold'
          : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-black dark:hover:text-white'
      } ${collapsed ? 'justify-center px-2' : ''}`}
      title={collapsed ? item.label : undefined}
    >
      <div className="relative flex-shrink-0">
        {/* Cleaner icon with stroke weight adjustments */}
        <item.icon
          size={20}
          strokeWidth={isActive ? 2 : 1.75}
          className="transition-all duration-200"
        />
        {item.badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900">
            {item.badge}
          </span>
        )}
      </div>
      {!collapsed && (
        <span className="text-sm truncate tracking-tight">{item.label}</span>
      )}

      {/* Subtle active indicator dot instead of full background wash if preferred, 
          but rounded-xl bg is already quite clean. 
          Let's stick to the rounded bg but keeping it neutral (as above) 
      */}
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

  const handleLogout = () => {
    // Implement logout logic or prop
    console.log('Logout clicked');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-300">
      {/* Logo Area */}
      <div
        className={`flex items-center gap-3 h-16 px-4 mb-2 ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <Link to="/admin" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
            <Shield
              size={20}
              className="text-white dark:text-black"
              strokeWidth={2.5}
            />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-black dark:text-white tracking-tight">
              Admin Panel
            </span>
          )}
        </Link>
      </div>

      {/* Collapse Toggle (Desktop only) */}
      {!mobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mx-auto mb-4 p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-all text-neutral-500"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1 hide-scrollbar">
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

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 mt-auto">
        <div
          className={`flex items-center gap-3 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 font-bold border border-neutral-200 dark:border-neutral-700">
            A
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-black dark:text-white truncate">
                Admin
              </p>
              <p className="text-xs text-neutral-500 truncate">Super Admin</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
