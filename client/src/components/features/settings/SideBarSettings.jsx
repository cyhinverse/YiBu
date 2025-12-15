import { NavLink } from 'react-router-dom';
import {
  User,
  Settings,
  Shield,
  Bell,
  Palette,
  ChevronRight,
  Lock,
  UserX,
  UserPlus,
} from 'lucide-react';

const menuItems = [
  {
    title: 'Account',
    description: 'Manage your account settings',
    icon: User,
    path: '/settings/account',
  },
  {
    title: 'Profile',
    description: 'Edit your profile information',
    icon: Settings,
    path: '/settings/profile',
  },
  {
    title: 'Privacy',
    description: 'Control your privacy settings',
    icon: Shield,
    path: '/settings/privacy',
  },
  {
    title: 'Security',
    description: '2FA and login security',
    icon: Lock,
    path: '/settings/security',
  },
  {
    title: 'Notifications',
    description: 'Manage notification preferences',
    icon: Bell,
    path: '/settings/notification',
  },
  {
    title: 'Blocked & Muted',
    description: 'Manage blocked and muted users',
    icon: UserX,
    path: '/settings/blocked',
  },
  {
    title: 'Follow Requests',
    description: 'Pending follow requests',
    icon: UserPlus,
    path: '/settings/follow-requests',
  },
  {
    title: 'Appearance',
    description: 'Theme and display settings',
    icon: Palette,
    path: '/settings/theme',
  },
];

const SideBarSettings = () => {
  return (
    <div className="h-full overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-xl font-bold text-black dark:text-white">
          Settings
        </h2>
      </div>
      <div className="overflow-y-auto flex-1 p-2">
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? 'bg-neutral-100 dark:bg-neutral-800'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isActive
                          ? 'bg-black dark:bg-white'
                          : 'bg-neutral-100 dark:bg-neutral-800'
                      }`}
                    >
                      <item.icon
                        size={18}
                        className={
                          isActive
                            ? 'text-white dark:text-black'
                            : 'text-neutral-500'
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          isActive
                            ? 'text-black dark:text-white'
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`flex-shrink-0 ${
                        isActive
                          ? 'text-black dark:text-white'
                          : 'text-neutral-300'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SideBarSettings;
