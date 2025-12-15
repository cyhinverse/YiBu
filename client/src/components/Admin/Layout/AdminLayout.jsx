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
  X,
  Moon,
  Sun,
  Bell,
  Search,
  ChevronLeft,
  HeartPulse,
  Send,
} from 'lucide-react';

// Fake admin user
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('admin-theme') === 'dark';
  });

  const toggleTheme = () => {
    const newDark = !isDarkMode;
    setIsDarkMode(newDark);
    localStorage.setItem('admin-theme', newDark ? 'dark' : 'light');
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    // Fake logout
    console.log('Logout clicked');
  };

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center">
            <span className="text-white dark:text-black font-bold text-sm">
              Y
            </span>
          </div>
          {(sidebarOpen || mobile) && (
            <span className="font-bold text-black dark:text-white">
              Admin Panel
            </span>
          )}
        </Link>
        {!mobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChevronLeft
              size={18}
              className={`text-neutral-500 transition-transform ${
                !sidebarOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              setActivePage(item.id);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activePage === item.id
                ? 'bg-black dark:bg-white text-white dark:text-black font-medium'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white'
            }`}
            title={!sidebarOpen && !mobile ? item.label : undefined}
          >
            <item.icon size={20} className="flex-shrink-0" />
            {(sidebarOpen || mobile) && (
              <span className="text-sm flex-1 text-left">{item.label}</span>
            )}
            {item.badge && (sidebarOpen || mobile) && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
        <div
          className={`flex items-center gap-3 p-2 rounded-lg ${
            sidebarOpen || mobile ? '' : 'justify-center'
          }`}
        >
          <img
            src={ADMIN_USER.avatar}
            alt={ADMIN_USER.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
          />
          {(sidebarOpen || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black dark:text-white truncate">
                {ADMIN_USER.name}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {ADMIN_USER.role}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
            !sidebarOpen && !mobile ? 'justify-center' : ''
          }`}
        >
          <LogOut size={20} />
          {(sidebarOpen || mobile) && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-[72px]'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-neutral-900 shadow-xl">
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Menu
                size={20}
                className="text-neutral-600 dark:text-neutral-400"
              />
            </button>
            <h1 className="text-lg font-semibold text-black dark:text-white capitalize">
              {menuItems.find(item => item.id === activePage)?.label ||
                'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-64 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
                />
              </div>
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <Bell
                size={20}
                className="text-neutral-600 dark:text-neutral-400"
              />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {isDarkMode ? (
                <Sun
                  size={20}
                  className="text-neutral-600 dark:text-neutral-400"
                />
              ) : (
                <Moon
                  size={20}
                  className="text-neutral-600 dark:text-neutral-400"
                />
              )}
            </button>

            {/* Back to App */}
            <Link
              to="/"
              className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              Back to App
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
