import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, X, UserPlus, Check } from "lucide-react";

// Fake search results
const FAKE_USERS = [
  {
    _id: "u1",
    name: "Sarah Chen",
    username: "sarahchen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    bio: "Product Designer @Company",
    isFollowing: false,
  },
  {
    _id: "u2",
    name: "Mike Johnson",
    username: "mikej",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    bio: "Software Engineer",
    isFollowing: true,
  },
  {
    _id: "u3",
    name: "Emma Wilson",
    username: "emmaw",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    bio: "UI/UX Designer",
    isFollowing: false,
  },
  {
    _id: "u4",
    name: "Alex Rivera",
    username: "alexr",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    bio: "Full-stack Developer",
    isFollowing: true,
  },
  {
    _id: "u5",
    name: "Jordan Lee",
    username: "jordanl",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
    bio: "Creative Director",
    isFollowing: false,
  },
];

const SearchUser = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
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
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Simulate search with delay
    setLoading(true);
    const timer = setTimeout(() => {
      const filtered = FAKE_USERS.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[10vh]">
      <div
        ref={modalRef}
        className="w-full max-w-[600px] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl flex flex-col max-h-[70vh] overflow-hidden mx-4"
      >
        {/* Search Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-10 py-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                <X size={16} className="text-neutral-400" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-neutral-300 border-t-black dark:border-t-white rounded-full animate-spin mx-auto" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center">
              {searchQuery ? (
                <>
                  <Search size={32} className="mx-auto text-neutral-300 mb-2" />
                  <p className="text-neutral-500 text-sm">No users found</p>
                </>
              ) : (
                <>
                  <Search size={32} className="mx-auto text-neutral-300 mb-2" />
                  <p className="text-neutral-500 text-sm">
                    Search for users by name or username
                  </p>
                </>
              )}
            </div>
          ) : (
            searchResults.map((user) => (
              <Link
                key={user._id}
                to={`/profile/${user._id}`}
                onClick={onClose}
                className="flex items-center gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                {/* Avatar */}
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-black dark:text-white truncate">
                      {user.name}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 truncate">
                    @{user.username}
                  </p>
                  {user.bio && (
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {user.bio}
                    </p>
                  )}
                </div>

                {/* Follow Button */}
                <button
                  onClick={(e) => e.preventDefault()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    user.isFollowing
                      ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white border border-neutral-200 dark:border-neutral-700"
                      : "bg-black dark:bg-white text-white dark:text-black"
                  }`}
                >
                  {user.isFollowing ? (
                    <>
                      <Check size={14} />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      Follow
                    </>
                  )}
                </button>
              </Link>
            ))
          )}
        </div>

        {/* Close Button */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchUser;
