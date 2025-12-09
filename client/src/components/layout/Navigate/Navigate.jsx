import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  Home,
  MessageCircle,
  Moon,
  Search,
  Sun,
  Settings,
  Bell,
  User,
  LogOut,
  Bookmark,
  Sparkles,
  PenSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Fake user data
const CURRENT_USER = {
  name: "John Doe",
  username: "johndoe",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe",
};

// Custom Nav Item
const NavItem = ({
  to,
  icon: Icon,
  label,
  onClick,
  badge,
  isActive: forceActive,
  collapsed,
}) => {
  return (
    <NavLink to={to || "#"} onClick={onClick} className="group w-full">
      {({ isActive }) => {
        const active = forceActive !== undefined ? forceActive : isActive;
        return (
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-full transition-all w-full ${
              active
                ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-medium"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white"
            } ${collapsed ? "justify-center px-2" : ""}`}
            title={collapsed ? label : undefined}
          >
            <div className="relative flex-shrink-0">
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center px-1">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </div>
            {!collapsed && <span className="text-sm truncate">{label}</span>}
          </div>
        );
      }}
    </NavLink>
  );
};

const Navigate = ({ mobile = false, onCollapsedChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem("theme");
    if (saved) {
      return saved === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const toggleTheme = () => {
    const newDark = !isDarkMode;
    setIsDarkMode(newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
    if (newDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleSidebar = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

  const navItems = [
    { icon: Home, path: "/", label: "Home" },
    { icon: Search, path: "/explore", label: "Explore" },
    { icon: Bell, path: "/notifications", label: "Notifications", badge: 3 },
    { icon: MessageCircle, path: "/messages", label: "Messages", badge: 5 },
    { icon: Bookmark, path: "/profile/save-posts", label: "Saved" },
    { icon: User, path: "/profile", label: "Profile" },
  ];

  // Mobile Bottom Navigation
  if (mobile) {
    return (
      <div className="h-[56px] w-full flex justify-around items-center border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl">
        {navItems.slice(0, 5).map((item, i) => (
          <NavLink
            key={i}
            to={item.path}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center p-2 rounded-full transition-all ${
                isActive
                  ? "text-black dark:text-white"
                  : "text-neutral-400 hover:text-black dark:hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute -top-1 w-6 h-0.5 rounded-full bg-black dark:bg-white" />
                )}
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </>
            )}
          </NavLink>
        ))}
      </div>
    );
  }

  // Desktop Sidebar
  return (
    <div
      className={`h-full flex flex-col py-6 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-300 ease-in-out ${
        collapsed ? "px-2 w-[72px]" : "px-4 w-full"
      }`}
    >
      {/* Logo */}
      <Link
        to="/"
        className={`flex items-center gap-3 mb-8 ${
          collapsed ? "justify-center px-0" : "px-1"
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} className="text-white dark:text-black" />
        </div>
        {!collapsed && (
          <span className="text-xl font-semibold tracking-tight text-black dark:text-white">
            YiBu
          </span>
        )}
      </Link>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="mb-4 p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-all self-center"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight size={16} className="text-neutral-500" />
        ) : (
          <ChevronLeft size={16} className="text-neutral-500" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item, i) => (
          <NavItem
            key={i}
            to={item.path}
            icon={item.icon}
            label={item.label}
            badge={item.badge}
            collapsed={collapsed}
          />
        ))}

        {/* Settings */}
        <NavItem
          to="/settings"
          icon={Settings}
          label="Settings"
          collapsed={collapsed}
        />

        {/* Theme Toggle */}
        <div
          onClick={toggleTheme}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-full transition-all cursor-pointer text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white ${
            collapsed ? "justify-center px-2" : ""
          }`}
          title={
            collapsed ? (isDarkMode ? "Light mode" : "Dark mode") : undefined
          }
        >
          <div className="flex-shrink-0">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </div>
          {!collapsed && (
            <span className="text-sm">
              {isDarkMode ? "Light mode" : "Dark mode"}
            </span>
          )}
        </div>

        {/* Create Post Button */}
        {collapsed ? (
          <button
            className="mt-6 w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center mx-auto hover:opacity-80 transition-opacity"
            title="Create Post"
          >
            <PenSquare size={18} className="text-white dark:text-black" />
          </button>
        ) : (
          <button className="mt-6 flex items-center justify-center gap-2 py-2.5 px-4 w-full bg-black dark:bg-white text-white dark:text-black rounded-full font-medium text-sm hover:opacity-90 transition-opacity">
            <PenSquare size={16} />
            <span>Create Post</span>
          </button>
        )}
      </nav>

      {/* User Profile Card */}
      <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Link
          to="/profile"
          className={`flex items-center gap-3 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all group ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? CURRENT_USER.name : undefined}
        >
          <div className="relative flex-shrink-0">
            <img
              src={CURRENT_USER.avatar}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900" />
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black dark:text-white truncate leading-tight">
                  {CURRENT_USER.name}
                </p>
                <p className="text-xs text-neutral-500 truncate leading-tight mt-0.5">
                  @{CURRENT_USER.username}
                </p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <LogOut size={16} className="text-neutral-400" />
              </div>
            </>
          )}
        </Link>
      </div>
    </div>
  );
};

export default Navigate;
