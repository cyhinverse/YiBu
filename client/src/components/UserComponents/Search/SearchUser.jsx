import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, X, UserRound, Mail, Loader2 } from "lucide-react";
import User from "../../../services/userService";
import { useDebounce } from "../../../hooks/useDebounce";
import { USER_API_ENDPOINTS } from "../../../axios/apiEndpoint";

const SearchUser = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("accessToken");
        console.log(
          "Current token:",
          token ? token.substring(0, 20) + "..." : "not found"
        );

        if (!token) {
          setError("Bạn cần đăng nhập để sử dụng tính năng tìm kiếm.");
          setLoading(false);
          return;
        }

        console.log("Search query:", debouncedSearchQuery);

        const endpoint = `${
          USER_API_ENDPOINTS.SEARCH_USERS
        }?query=${encodeURIComponent(debouncedSearchQuery)}`;
        console.log("Search endpoint:", endpoint);

        const backendUrl = "http://localhost:9785";
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        console.log("Request headers:", headers);

        const response = await fetch(`${backendUrl}${endpoint}`, {
          method: "GET",
          headers: headers,
        });

        console.log("Fetch response status:", response.status);

        if (response.status === 401) {
          console.error("Lỗi xác thực: Bạn cần đăng nhập lại");

          localStorage.removeItem("accessToken");

          setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          return;
        }

        if (response.ok) {
          const data = await response.json();
          console.log("Search response data:", data);
          setSearchResults(data.data || []);
        } else {
          const errorData = await response.text();
          console.error("Error response:", errorData);
          throw new Error(`Máy chủ trả về mã lỗi: ${response.status}`);
        }
      } catch (err) {
        console.error("Error searching users:", err);
        setError("Không thể tìm kiếm người dùng. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [debouncedSearchQuery]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center transition-all duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ backdropFilter: "blur(5px)" }}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div
        ref={modalRef}
        className={`relative top-20 w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 ease-out border border-purple-100 ${
          isOpen ? "translate-y-0 scale-100" : "translate-y-10 scale-95"
        }`}
      >
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
          <h3 className="text-xl font-semibold">Tìm kiếm người dùng</h3>
          <p className="text-sm text-white/80">
            Nhập tên hoặc email để tìm kiếm
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <div className="flex items-center flex-1 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 border border-gray-200 transition-all duration-300 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100">
            <Search className="text-gray-400" size={20} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên hoặc email..."
              className="flex-1 ml-2 outline-none text-gray-700 bg-transparent placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="rounded-full p-1 hover:bg-gray-200 transition-colors"
                aria-label="Clear search"
              >
                <X className="text-gray-500" size={16} />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-3 bg-white/80">
          {loading ? (
            <div className="py-8 text-center text-gray-600 animate-pulse flex flex-col items-center">
              <Loader2 className="animate-spin mb-2" size={28} />
              <p>Đang tìm kiếm...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center text-red-500 bg-red-50 rounded-xl m-2 border border-red-100">
              <p>{error}</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((user) => (
                <Link
                  key={user._id}
                  to={`/profile/${user._id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const getFullUserInfo = async () => {
                      try {
                        await User.GET_USER_BY_ID(user._id);
                        window.location.href = `/profile/${user._id}`;
                        onClose();
                      } catch (err) {
                        console.error("Error fetching full user info:", err);
                        window.location.href = `/profile/${user._id}`;
                        onClose();
                      }
                    };
                    getFullUserInfo();
                  }}
                  className="flex items-center gap-4 p-3 hover:bg-purple-50 rounded-xl transition-all duration-300 border border-transparent hover:border-purple-100 hover:shadow-sm"
                >
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-gray-800">
                        {user.username}
                      </p>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Người dùng
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 gap-1 mt-0.5">
                      <Mail size={12} />
                      <span>{user.email}</span>
                    </div>
                  </div>
                  <div className="bg-purple-100 hover:bg-purple-200 p-2 rounded-full transition-colors">
                    <UserRound size={16} className="text-purple-700" />
                  </div>
                </Link>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="py-12 text-center space-y-3 text-gray-500">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Search size={24} className="text-gray-400" />
              </div>
              <p>Không tìm thấy người dùng nào</p>
              <p className="text-sm text-gray-400">
                Thử tìm kiếm với từ khóa khác
              </p>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3 text-gray-500">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <Search size={32} className="text-purple-500" />
              </div>
              <p>Nhập từ khóa để bắt đầu tìm kiếm</p>
              <p className="text-sm text-gray-400">
                Bạn có thể tìm kiếm theo tên người dùng hoặc email
              </p>
            </div>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="p-3 bg-gradient-to-t from-white to-transparent border-t border-gray-100 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Tìm thấy {searchResults.length} người dùng
            </p>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchUser;
