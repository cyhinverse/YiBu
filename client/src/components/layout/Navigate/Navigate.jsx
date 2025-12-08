import React, { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Home, MessageCircle, Moon, Search, Sun, Settings, Bell, User, MoreHorizontal, PenTool } from "lucide-react";

import { useDispatch, useSelector } from "react-redux";

import { setThemeSettings } from "../../../redux/slices/UserSlice";
import { updateThemeSettings } from "../../../redux/actions/userActions";
import SearchUser from "../../features/search/SearchUser";

// Helper for consistent Nav Items
const NavItem = ({ to, icon: Icon, label, onClick, isActive, isMobile }) => {
  if (isMobile) {
      return (
        <NavLink
            to={to || "#"}
            onClick={onClick}
            className={({ isActive: active }) =>
                `flex items-center justify-center w-full h-full ${active || isActive ? "text-primary" : "text-text-secondary"}`
            }
        >
            <Icon size={26} strokeWidth={isActive ? 2.8 : 2} />
        </NavLink>
      )
  }
  
  return (
    <NavLink
      to={to || "#"}
      onClick={onClick}
      className={({ isActive: active }) =>
        `flex items-center justify-start gap-4 px-3 py-3 rounded-full transition-all duration-200 group w-fit xl:w-full hover:bg-surface-highlight/50 ${
          active || isActive ? "font-bold text-text-primary" : "font-medium text-text-primary"
        }`
      }
    >
      <div className="relative">
        <Icon size={26} strokeWidth={isActive ? 2.8 : 2} />
        {/* Optional Dot for active state if needed, but X uses bold text/icon */}
      </div>
      <span className="hidden xl:block text-xl tracking-wide">{label}</span>
    </NavLink>
  );
};

const Navigate = ({ mobile = false }) => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const dispatch = useDispatch();

  const authState = useSelector((s) => s.auth);
  const userSettings = useSelector((state) => state.user?.settings);
  const theme = userSettings?.theme || { appearance: "system" };
  const isDarkMode =
    theme.appearance === "dark" ||
    (theme.appearance === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [userId, setUserId] = useState(null)

  useEffect(() => {
    if (authState?.user?.user?._id) {
       setUserId(authState.user.user._id);
    } else if (authState?.user?._id) {
       setUserId(authState.user._id);
    }
  }, [authState]);


  const handleOpenSearch = (e) => {
      if(e) e.preventDefault();
      setShowSearchModal(true);
  };
  const handleCloseSearch = () => setShowSearchModal(false);

  const toggleTheme = async () => {
    const newAppearance = isDarkMode ? "light" : "dark";
    const updatedTheme = { ...theme, appearance: newAppearance };
    dispatch(setThemeSettings(updatedTheme));
    try {
      await dispatch(updateThemeSettings(updatedTheme)).unwrap();
    } catch (error) {
      console.error("Error saving theme", error);
    }
  };

  const navItems = [
    { icon: Home, path: "/", label: "Home" },
    { icon: Search, path: "#", label: "Explore", onClick: handleOpenSearch }, 
    { icon: Bell, path: "/notifications", label: "Notifications" }, 
    { icon: MessageCircle, path: "/messages", label: "Messages" },
    { icon: User, path: userId ? `/profile/${userId}` : "/auth/login", label: "Profile" },
    { icon: Settings, path: "/settings", label: "Settings" },
  ];

  // Mobile Bottom Bar View
  if (mobile) {
      return (
          <div className="h-[60px] w-full flex justify-between items-center px-6">
             {navItems.slice(0, 5).map((item, i) => (
                 <div key={i} className="h-full flex-1 flex items-center justify-center">
                    <NavItem 
                        to={item.path} 
                        icon={item.icon} 
                        onClick={item.onClick}
                        isMobile={true}
                        isActive={window.location.pathname === item.path}
                    />
                 </div>
             ))}
                 <div className="h-full flex-1 flex items-center justify-center" onClick={toggleTheme}>
                    <Sun size={24} className="text-text-secondary" />
                 </div>
             <SearchUser isOpen={showSearchModal} onClose={handleCloseSearch} />
          </div>
      )
  }

  // Desktop Vertical Sidebar View
  return (
    <div className="h-full flex flex-col justify-between px-2 xl:px-4 py-4 overflow-y-auto custom-scrollbar">
      
      {/* Top Section */}
      <div className="flex flex-col gap-2 items-center xl:items-start">
        {/* Logo */}
        <Link to="/" className="p-3 mb-2 rounded-full hover:bg-surface-highlight/50 transition-colors w-fit">
           <span className="text-3xl font-black font-heading tracking-tighter text-primary">Y.</span>
        </Link>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-2 w-full items-center xl:items-start">
           {navItems.map((item, i) => (
             <NavItem
                key={i}
                to={item.path}
                icon={item.icon}
                label={item.label}
                onClick={item.onClick}
             />
           ))}
           
           {/* Theme Toggle (Custom for Desktop List) */}
           <div 
             onClick={toggleTheme}
             className="flex items-center justify-start gap-4 px-3 py-3 rounded-full transition-all duration-200 group w-fit xl:w-full hover:bg-surface-highlight/50 cursor-pointer text-text-primary"
           >
              <div className="relative">
                 {isDarkMode ? <Sun size={26} /> : <Moon size={26} />}
              </div>
              <span className="hidden xl:block text-xl tracking-wide font-medium">Theme</span>
           </div>
        </nav>

        {/* Post Button */}
        <button className="hidden xl:block w-[90%] mt-4 bg-primary text-white font-bold text-lg py-3  hover:bg-primary/90 transition-all">
            Post
        </button>
        <button className="xl:hidden mt-4 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/90">
            <PenTool size={24} />
        </button>
      </div>

      {/* Bottom Section: User Profile */}
      <div className="mt-auto w-full">
         <Link 
            to={userId ? `/profile/${userId}` : "/auth/login"}
            className="flex items-center gap-3 p-3 rounded-full hover:bg-surface-highlight/50 transition-all w-full cursor-pointer"
         >
            <img
              src={authState?.user?.avatar || "https://via.placeholder.com/40"}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="hidden xl:flex flex-col flex-1 overflow-hidden">
                <span className="text-base font-bold text-text-primary truncate">{authState?.user?.username || "Guest"}</span>
                <span className="text-sm text-text-secondary truncate">@{authState?.user?.username || "guest"}</span>
            </div>
            <MoreHorizontal size={18} className="hidden xl:block text-text-secondary" />
         </Link>
      </div>

      <SearchUser isOpen={showSearchModal} onClose={handleCloseSearch} />
    </div>
  );
};

export default Navigate;
