import { useState } from 'react';
import { Menu, Moon, Sun, Bell, Search } from 'lucide-react';
import Sidebar from './Sidebar';

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

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-black font-sans text-neutral-900 dark:text-white overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-full fixed left-0 top-0 z-30 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64' : 'w-[72px]'
        }`}
      >
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 shadow-2xl transform transition-transform duration-300 ease-out">
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
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-[72px]'
        }`}
      >
        {/* Header */}
        <header className="h-16 sticky top-0 z-20 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb / Title */}
            <div>
              <h1 className="text-lg font-bold text-black dark:text-white tracking-tight capitalize">
                {activePage}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search - compact */}
            <div className="hidden md:flex items-center mr-2">
              <div className="relative group">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-600 dark:group-focus-within:text-neutral-300 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Hành động nhanh..."
                  className="pl-9 pr-4 py-2 w-64 bg-neutral-100 dark:bg-neutral-800 border-none rounded-full text-sm focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700 outline-none transition-all placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-neutral-900" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-x-hidden overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
