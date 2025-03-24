import React, { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, MessageCircle, Moon, Search, Sun, Settings } from "lucide-react";
import { DataContext } from "../../../DataProvider";
import { useDispatch, useSelector } from "react-redux";
import POST from "../../../services/postService";
import { getPostUserById } from "../../../slices/PostSlice";
import { setThemeSettings } from "../../../slices/UserSlice";
import UserSettingsService from "../../../services/userSettingsService";
import SearchUser from "../Search";
import NotificationBell from "../Notification/NotificationBell";

const Navigate = () => {
  const { hideSearch, setHideSearch } = useContext(DataContext);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const dispatch = useDispatch();

  const navItems = [
    { icon: Home, path: "/" },
    { icon: MessageCircle, path: "/messages" },
  ];

  const authState = useSelector((s) => s.auth);
  const userSettings = useSelector((state) => state.user?.settings);
  const theme = userSettings?.theme || { appearance: "system" };
  const isDarkMode =
    theme.appearance === "dark" ||
    (theme.appearance === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  console.log(`Check authState::::`, authState);

  let userId = null;

  if (authState && authState.user) {
    if (authState.user.user && authState.user.user._id) {
      userId = authState.user.user._id;
    } else if (authState.user._id) {
      userId = authState.user._id;
    }
  }

  useEffect(() => {
    const fetchPostOfUser = async () => {
      if (!userId) {
        console.log("Không có ID người dùng, bỏ qua fetch posts");
        return;
      }

      try {
        const res = await POST.GET_POST_USER_BY_ID(userId);
        console.log(`Check res from navigate::::`, res);
        dispatch(getPostUserById(res.postOfUser));
      } catch (error) {
        console.log(`Error:::`, error);
      }
    };
    fetchPostOfUser();
  }, [userId, dispatch]);

  const handleOpenSearch = () => {
    setShowSearchModal(true);
    setHideSearch(true);
  };

  const handleCloseSearch = () => {
    setShowSearchModal(false);
    setHideSearch(false);
  };

  const toggleTheme = () => {
    const newAppearance = isDarkMode ? "light" : "dark";
    const updatedTheme = {
      ...theme,
      appearance: newAppearance,
    };

    console.log(`Toggling theme to ${newAppearance}`, updatedTheme);
    dispatch(setThemeSettings(updatedTheme));

    // Save to server
    try {
      UserSettingsService.updateThemeSettings(updatedTheme)
        .then((response) => {
          console.log("Theme setting saved to server", response);
        })
        .catch((error) => {
          console.error("Error saving theme setting", error);
        });
    } catch (error) {
      console.error("Error saving theme setting", error);
    }
  };

  return (
    <>
      <div className="hidden md:flex w-[250px] h-[50px] items-center px-4 shadow-md rounded-xl  border border-gray-300">
        {hideSearch && <Search />}
        <input
          onClick={handleOpenSearch}
          className="indent-2 h-full flex-1 outline-none cursor-pointer bg-transparent"
          type="text"
          placeholder="Search users..."
          readOnly
        />
      </div>

      <SearchUser isOpen={showSearchModal} onClose={handleCloseSearch} />

      <div className="flex w-[200px] md:w-[250px] h-[50px] justify-between items-center px-3 md:px-6 shadow-md border border-gray-300 rounded-xl ">
        {navItems.map((item, i) => (
          <NavLink
            key={i}
            to={item.path}
            className={({ isActive }) =>
              `w-[35px] md:w-[40px] h-[35px] md:h-[40px] flex items-center justify-center rounded-lg hover:opacity-50 transition-all ease-out cursor-pointer ${
                isActive ? "text-red-300" : ""
              }`
            }
          >
            <item.icon size={25} />
          </NavLink>
        ))}

        <NavLink
          to={userId ? `/profile/${userId}` : "/auth/login"}
          className="w-[35px] md:w-[40px] h-[35px] md:h-[40px] flex items-center justify-center rounded-full hover:opacity-50 transition-all ease-out cursor-pointer"
        >
          <img
            src={`${authState?.user?.avatar} `}
            alt="Profile"
            className="w-[30px] md:w-[30px] h-[30px] md:h-[30px] rounded-full object-cover"
          />
        </NavLink>
      </div>

      <div className="flex w-[150px] md:w-[200px] h-[50px] justify-center items-center gap-2 md:gap-4 px-3 md:px-6 shadow-md border border-gray-300 rounded-xl ">
        <div
          onClick={toggleTheme}
          className="cursor-pointer w-[35px] md:w-[40px] h-[35px] md:h-[40px] items-center justify-center flex rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
          title={
            isDarkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"
          }
        >
          {isDarkMode ? (
            <Sun
              size={20}
              className="text-yellow-500 transition-transform duration-300 hover:rotate-45"
            />
          ) : (
            <Moon
              size={20}
              className="text-indigo-400 transition-transform duration-300 hover:rotate-12"
            />
          )}
        </div>
        <div className="w-[35px] md:w-[40px] h-[35px] md:h-[40px] items-center justify-center flex">
          <NotificationBell />
        </div>
        <div
          className="md:hidden w-[35px] h-[35px] items-center justify-center flex"
          onClick={handleOpenSearch}
        >
          <Search className="cursor-pointer" size={20} />
        </div>
        <NavLink
          to="/settings"
          className="w-[35px] md:w-[40px] h-[35px] md:h-[40px] items-center justify-center flex"
        >
          <Settings className="cursor-pointer" size={20} />
        </NavLink>
      </div>
    </>
  );
};

export default Navigate;
