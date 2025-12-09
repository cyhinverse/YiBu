import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  Check,
  MessageCircle,
  MoreHorizontal,
  X,
} from "lucide-react";

// Fake friends
const FAKE_FRIENDS = [
  {
    _id: "u1",
    name: "Sarah Chen",
    username: "sarahchen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    bio: "Product Designer",
    isVerified: true,
    isOnline: true,
  },
  {
    _id: "u2",
    name: "Mike Johnson",
    username: "mikej",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    bio: "Software Engineer",
    isVerified: false,
    isOnline: false,
  },
  {
    _id: "u3",
    name: "Emma Wilson",
    username: "emmaw",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    bio: "UI/UX Designer",
    isVerified: true,
    isOnline: true,
  },
  {
    _id: "u4",
    name: "Alex Kim",
    username: "alexk",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    bio: "Full Stack Developer",
    isVerified: false,
    isOnline: false,
  },
];

const Friends = () => {
  const [friends, setFriends] = useState(FAKE_FRIENDS);
  const [showMenu, setShowMenu] = useState(null);

  const handleRemoveFriend = (userId) => {
    setFriends((prev) => prev.filter((f) => f._id !== userId));
    setShowMenu(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-black dark:text-white" />
            <div>
              <h1 className="text-lg font-bold text-black dark:text-white">
                Friends
              </h1>
              <p className="text-sm text-neutral-500">
                {friends.length} friends
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Friends Grid */}
      {friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
          <Users size={48} className="mb-4 text-neutral-300" />
          <h2 className="text-lg font-semibold text-black dark:text-white mb-2">
            No friends yet
          </h2>
          <p className="text-sm">Start connecting with people</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
          {friends.map((friend) => (
            <div
              key={friend._id}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <Link
                  to={`/profile/${friend.username}`}
                  className="relative flex-shrink-0"
                >
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
                  />
                  {friend.isOnline && (
                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900" />
                  )}
                  {friend.isVerified && !friend.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center border-2 border-white dark:border-neutral-900">
                      <Check size={8} className="text-white dark:text-black" />
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${friend.username}`}
                    className="font-medium text-black dark:text-white hover:underline truncate block"
                  >
                    {friend.name}
                  </Link>
                  <p className="text-sm text-neutral-500 truncate">
                    @{friend.username}
                  </p>
                  {friend.bio && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate mt-1">
                      {friend.bio}
                    </p>
                  )}
                </div>

                {/* Menu */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setShowMenu(showMenu === friend._id ? null : friend._id)
                    }
                    className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <MoreHorizontal size={18} className="text-neutral-500" />
                  </button>

                  {showMenu === friend._id && (
                    <div className="absolute right-0 top-10 w-48 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-lg overflow-hidden z-10">
                      <button
                        onClick={() => handleRemoveFriend(friend._id)}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Remove friend
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4">
                <Link
                  to={`/messages/${friend._id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <MessageCircle size={16} />
                  Message
                </Link>
                <Link
                  to={`/profile/${friend.username}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-black dark:text-white text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Friends;
