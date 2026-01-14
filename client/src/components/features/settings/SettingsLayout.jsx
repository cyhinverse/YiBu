import { Outlet } from 'react-router-dom';
import SideBarSettings from './SideBarSettings';

const SettingsLayout = () => {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[calc(100vh-120px)]">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <SideBarSettings />
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          <div className="bg-neutral-50/50 dark:bg-neutral-800/20 rounded-2xl h-full overflow-hidden">
            <div className="p-6 overflow-y-auto h-full">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
