import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Moon,
  Sun,
  Bell,
  Search,
  ChevronLeft,
  HeartPulse,
  Send,
} from 'lucide-react';

// Fake admin user - should be replaced with real user data later
const ADMIN_USER = {
  name: 'Admin User',
  email: 'admin@yibu.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  role: 'Super Admin',
};

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'users', icon: Users, label: 'Users' },
  { id: 'posts', icon: FileText, label: 'Posts' },
  { id: 'comments', icon: MessageSquare, label: 'Comments' },
  { id: 'reports', icon: Flag, label: 'Reports', badge: 5 },
  { id: 'interactions', icon: Activity, label: 'Interactions' },
  { id: 'banned', icon: UserX, label: 'Banned Users' },
  { id: 'revenue', icon: DollarSign, label: 'Revenue' },
  { id: 'broadcast', icon: Send, label: 'Broadcast' },
  { id: 'systemhealth', icon: HeartPulse, label: 'System Health' },
  { id: 'adminlogs', icon: ScrollText, label: 'Activity Logs' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

const AdminLayout = ({ children, activePage, setActivePage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDarkMode = document.documentElement.classList.contains('dark');

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('appearance', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      localStorage.setItem('appearance', 'dark');
    }
  };

  const handleLogout = () => {
    // Fake logout
    console.log('Logout clicked');
  };

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full bg-surface dark:bg-surface border-r border-border">
      {/* Logo */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-border/50">
        <Link to="/admin" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/10 group-hover:scale-105 transition-transform duration-300">
            <span className="text-primary-foreground font-bold text-xl">Y</span>
          </div>
          {(sidebarOpen || mobile) && (
            <span className="font-bold text-xl text-primary tracking-tight">
              Admin
            </span>
          )}
        </Link>
        {!mobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-surface-hover transition-colors text-secondary"
          >
            <ChevronLeft
              size={20}
              className={`transition-transform duration-300 ${
                !sidebarOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 hide-scrollbar">
        {menuItems.map(item => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActivePage(item.id);
                setMobileMenuOpen(false);
              }}
              className={`yb-nav-item ${isActive ? 'active' : ''} w-full ${
                !sidebarOpen && !mobile ? 'justify-center px-0' : ''
              } relative`}
              title={!sidebarOpen && !mobile ? item.label : undefined}
            >
              <item.icon
                size={22}
                className={`flex-shrink-0 transition-transform duration-300 ${
                  !isActive && 'group-hover:scale-110'
                }`}
              />
              {(sidebarOpen || mobile) && (
                <span className="text-[15px] font-medium flex-1 text-left tracking-wide">
                  {item.label}
                </span>
              )}
              {item.badge && (sidebarOpen || mobile) && (
                <span className="yb-badge bg-error text-white shadow-sm">
                  {item.badge}
                </span>
              )}

              {/* Active Indicator for collapsed sidebar */}
              {!sidebarOpen && !mobile && isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full shadow-[0_0_10px_rgba(0,0,0,0.1)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border bg-surface-secondary/30">
        <div
          className={`flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border shadow-sm ${
            sidebarOpen || mobile ? '' : 'justify-center px-0'
          }`}
        >
          <img
            src={ADMIN_USER.avatar}
            alt={ADMIN_USER.name}
            className="yb-avatar w-10 h-10 border-2 border-surface"
          />
          {(sidebarOpen || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary truncate">
                {ADMIN_USER.name}
              </p>
              <p className="text-xs text-secondary font-medium truncate">
                {ADMIN_USER.role}
              </p>
            </div>
          )}
          {(sidebarOpen || mobile) && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-secondary hover:text-error hover:bg-error/10 transition-all"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
        {!sidebarOpen && !mobile && (
          <button
            onClick={handleLogout}
            className="w-full mt-2 p-3 rounded-2xl text-secondary hover:text-error hover:bg-error/10 transition-all flex justify-center"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background font-sans text-content">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-full fixed left-0 top-0 z-30 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-72' : 'w-[88px]'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-surface shadow-2xl transform transition-transform duration-300 ease-out">
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'md:ml-72' : 'md:ml-[88px]'
        }`}
      >
        {/* Header */}
        <header className="h-20 sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-surface-hover text-secondary"
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-primary tracking-tight">
                {menuItems.find(item => item.id === activePage)?.label ||
                  'Dashboard'}
              </h1>
              <p className="text-xs font-medium text-secondary hidden sm:block mt-0.5">
                YiBu Admin Panel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center">
              <div className="relative group">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors"
                />
                <input
                  type="text"
                  placeholder="Hành động nhanh..."
                  className="yb-input pl-11 py-2.5 w-64 text-sm"
                />
              </div>
            </div>

            <div className="h-6 w-px bg-border mx-2 hidden md:block" />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-surface-hover text-secondary transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notifications */}
            <button className="relative p-2.5 rounded-full hover:bg-surface-hover text-secondary transition-colors">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full border-2 border-surface" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
