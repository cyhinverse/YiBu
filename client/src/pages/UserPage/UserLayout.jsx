import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navigate from '@/components/Common/Navigate';
const UserLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useSelector(state => state.auth);

  // Unread counts are handled by React Query in Navigate/Notification components
  useEffect(() => {
    // No need to dispatch Redux actions for unread counts anymore
  }, [user?._id]);

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-black">
      {/* Left Sidebar (Navigation) - Fixed */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64 xl:w-72'
        }`}
      >
        <Navigate onCollapsedChange={setSidebarCollapsed} />
      </aside>

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full min-h-screen transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64 xl:ml-72'
        }`}
      >
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 w-full z-50">
        <Navigate mobile={true} />
      </div>
    </div>
  );
};

export default UserLayout;
