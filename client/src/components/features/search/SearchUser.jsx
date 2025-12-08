import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
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
        if (!token) {
          setError("Please login to search.");
          setLoading(false);
          return;
        }

        const endpoint = `${USER_API_ENDPOINTS.SEARCH_USERS}?query=${encodeURIComponent(debouncedSearchQuery)}`;
        const backendUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:9785";
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const response = await fetch(`${backendUrl}${endpoint}`, {
          method: "GET",
          headers: headers,
        });

        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          setError("Session expired.");
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.data || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Error searching users:", err);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[10vh]">
      <div
        ref={modalRef}
        className="w-full max-w-[600px] bg-white rounded-2xl shadow-2xl flex flex-col max-h-[70vh] overflow-hidden mx-4"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-3 px-4 border-b border-gray-100">
           {/* Search Bar */}
           <div className="flex-1 relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
                  <Search size={18} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full h-10 pl-10 pr-10 bg-gray-100 rounded-full border-transparent focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-black placeholder:text-gray-500 transition-all text-[15px]"
              />
              {searchQuery && (
                <button 
                    onClick={handleClearSearch} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-500 text-white rounded-full p-0.5 hover:bg-black transition-colors"
                >
                   <X size={14} />
                </button>
              )}
           </div>

           {/* Cancel Button */}
           <button 
             onClick={onClose}
             className="text-black font-semibold text-[15px] hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors"
           >
              Cancel
           </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-[300px] bg-white">
           {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                 <Loader2 className="animate-spin text-black mb-2" size={24} />
              </div>
           ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                 <span className="text-gray-500 text-sm">{error}</span>
              </div>
           ) : searchResults.length > 0 ? (
              <div className="py-2">
                 {searchResults.map(user => (
                    <Link
                       key={user._id}
                       to={`/profile/${user._id}`}
                       onClick={() => onClose()}
                       className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                       <img 
                          src={user.avatar || "https://via.placeholder.com/40"} 
                          alt={user.username} 
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                       />
                       <div className="flex flex-col">
                          <span className="font-bold text-black text-[15px] leading-tight hover:underline">
                              {user.username}
                          </span>
                          <span className="text-gray-500 text-[14px]">
                              @{user.username || "user"}
                          </span>
                       </div>
                    </Link>
                 ))}
              </div>
           ) : searchQuery ? (
               <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <span className="text-black font-bold text-lg mb-1">No results for "{searchQuery}"</span>
                  <span className="text-gray-500 text-sm">The term you entered did not bring up any results</span>
               </div>
           ) : (
               <div className="flex flex-col items-center justify-center py-12 text-center px-6 text-gray-500">
                   <p>Try searching for people, lists, or keywords</p>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default SearchUser;
