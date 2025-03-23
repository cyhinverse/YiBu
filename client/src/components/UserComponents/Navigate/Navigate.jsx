import React, { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Bell,
  Home,
  MessageCircle,
  Moon,
  Search,
  Sun,
  Settings,
  Music,
} from "lucide-react";
import { DataContext } from "../../../DataProvider";
import { useDispatch, useSelector } from "react-redux";
import POST from "../../../services/postService";
import { getPostUserById } from "../../../slices/PostSlice";
import SearchUser from "../Search";
import NotificationBell from "../Notification/NotificationBell";

const Navigate = () => {
  const { hideSearch, setHideSearch } = useContext(DataContext);
  const [sunMoon, setSunMoon] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const dispatch = useDispatch();

  const navItems = [
    { icon: Home, path: "/" },
    { icon: MessageCircle, path: "/messages" },
  ];

  // Lấy user từ Redux và kiểm tra các trường hợp undefined
  const authState = useSelector((s) => s.auth);
  // Kiểm tra cấu trúc dữ liệu có lồng nhau hay không
  let userId = null;

  if (authState && authState.user) {
    // Nếu là cấu trúc lồng { user: { user: {...} } }
    if (authState.user.user && authState.user.user._id) {
      userId = authState.user.user._id;
    }
    // Nếu là cấu trúc đơn giản { user: {...} }
    else if (authState.user._id) {
      userId = authState.user._id;
    }
  }

  // Chỉ gọi API khi đã có userId
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

  return (
    <>
      <div className="hidden md:flex w-[250px] h-[50px] items-center px-4 shadow-md rounded-xl bg-purple-100 border border-gray-300">
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

      <div className="flex w-[200px] md:w-[250px] h-[50px] justify-between items-center px-3 md:px-6 shadow-md border border-gray-300 rounded-xl bg-purple-100">
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
            src="https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Profile"
            className="w-[35px] md:w-[40px] h-[35px] md:h-[40px] rounded-full object-cover"
          />
        </NavLink>
      </div>

      <div className="flex w-[150px] md:w-[200px] h-[50px] justify-center items-center gap-2 md:gap-4 px-3 md:px-6 shadow-md border border-gray-300 rounded-xl bg-purple-100">
        <div
          onClick={() => setSunMoon(!sunMoon)}
          className="cursor-pointer w-[35px] md:w-[40px] h-[35px] md:h-[40px] items-center justify-center flex"
        >
          {sunMoon ? <Sun size={20} /> : <Moon size={20} />}
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
