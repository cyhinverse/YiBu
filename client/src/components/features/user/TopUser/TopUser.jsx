import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Check } from "lucide-react";

// Fake suggested users
const FAKE_USERS = [
  {
    _id: "u1",
    name: "Sarah Chen",
    username: "sarahchen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    bio: "Product Designer",
    isVerified: true,
  },
  {
    _id: "u2",
    name: "Mike Johnson",
    username: "mikej",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    bio: "Software Engineer",
    isVerified: false,
  },
  {
    _id: "u3",
    name: "Emma Wilson",
    username: "emmaw",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    bio: "UI/UX Designer",
    isVerified: true,
  },
];

const TopUser = ({ users = FAKE_USERS }) => {
  const [followedUsers, setFollowedUsers] = useState([]);

  const handleFollow = (e, userId) => {
    e.preventDefault();
    e.stopPropagation();
    setFollowedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="flex flex-col gap-1">
      {users.map((user) => {
        const isFollowed = followedUsers.includes(user._id);
        return (
          <Link
            key={user._id}
            to={`/profile/${user._id}`}
            className="px-2 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-all flex items-center gap-3 group"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
              />
              {user.isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center border-2 border-white dark:border-neutral-900">
                  <Check size={8} className="text-white dark:text-black" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-black dark:text-white truncate">
                  {user.name}
                </span>
              </div>
              <span className="text-xs text-neutral-500 truncate block">
                @{user.username}
              </span>
            </div>

            {/* Follow Button */}
            <button
              onClick={(e) => handleFollow(e, user._id)}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium flex-shrink-0 transition-colors ${
                isFollowed
                  ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white border border-neutral-200 dark:border-neutral-700"
                  : "bg-black dark:bg-white text-white dark:text-black"
              }`}
            >
              {isFollowed ? (
                <>
                  <Check size={12} />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus size={12} />
                  <span>Follow</span>
                </>
              )}
            </button>
          </Link>
        );
      })}
    </div>
  );
};

export default TopUser;
