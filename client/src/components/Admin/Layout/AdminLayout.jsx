import { useState, useEffect } from 'react';
import { Menu, Moon, Sun, Bell, Command, X } from 'lucide-react';
import Sidebar from './Sidebar';

const pageLabels = {
  dashboard: 'Tổng quan',
  users: 'Người dùng',
  posts: 'Bài viết',
  comments: 'Bình luận',
  reports: 'Báo cáo',
  interactions: 'Tương tác',
  banned: 'Tài khoản bị chặn',
  revenue: 'Doanh thu',
  broadcast: 'Thông báo',
  systemhealth: 'Hệ thống',
  settings: 'Cài đặt',
  adminlogs: 'Nhật ký',
};

const AdminLayout = ({ children, activePage, setActivePage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('appearance', 'light');
      setIsDarkMode(false);
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      localStorage.setItem('appearance', 'dark');
      setIsDarkMode(true);
    }
  };

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-neutral-950 font-sans text-neutral-900 dark:text-neutral-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-full fixed left-0 top-0 z-30 transition-all duration-300 ${
          sidebarOpen ? 'w-60' : 'w-[68px]'
        }`}
      >
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/20 dark:bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-neutral-900 shadow-xl">
            <Sidebar
              activePage={activePage}
              setActivePage={setActivePage}
              sidebarOpen={true}
              mobile={true}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-60' : 'lg:ml-[68px]'
        }`}
      >
        {/* Header */}
        <header className="h-14 sticky top-0 z-20 bg-stone-50/90 dark:bg-neutral-950/90 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400"
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>

            <h1 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
              {pageLabels[activePage] || activePage}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Search Hint */}
            <button className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100/80 dark:bg-neutral-800/50 rounded-lg hover:bg-neutral-200/80 dark:hover:bg-neutral-800 transition-colors">
              <Command size={12} strokeWidth={2} />
              <span>K</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 transition-colors"
            >
              {isDarkMode ? (
                <Sun size={18} strokeWidth={1.5} />
              ) : (
                <Moon size={18} strokeWidth={1.5} />
              )}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 transition-colors">
              <Bell size={18} strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden overflow-y-auto">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
