import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Check, Users } from "lucide-react";

// Fake suggested users
const FAKE_SUGGESTIONS = [
  {
    _id: "u1",
    name: "Sarah Chen",
    username: "sarahchen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    bio: "Product Designer at Company",
    mutualFriends: 12,
    isVerified: true,
  },
  {
    _id: "u2",
    name: "Mike Johnson",
    username: "mikej",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    bio: "Software Engineer",
    mutualFriends: 8,
    isVerified: false,
  },
  {
    _id: "u3",
    name: "Emma Wilson",
    username: "emmaw",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    bio: "UI/UX Designer",
    mutualFriends: 5,
    isVerified: true,
  },
  {
    _id: "u4",
    name: "Alex Kim",
    username: "alexk",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    bio: "Full Stack Developer",
    mutualFriends: 3,
    isVerified: false,
  },
];

const SuggestFriends = () => {
  const [followedUsers, setFollowedUsers] = useState([]);

  const handleFollow = (userId) => {
    setFollowedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="font-semibold text-black dark:text-white">
          Suggested for you
        </h2>
        <p className="text-sm text-neutral-500">People you may know</p>
      </div>

      {/* Users List */}
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {FAKE_SUGGESTIONS.map((user) => {
          const isFollowed = followedUsers.includes(user._id);
          return (
            <div
              key={user._id}
              className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <Link
                  to={`/profile/${user.username}`}
                  className="relative flex-shrink-0"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
                  />
                  {user.isVerified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center border-2 border-white dark:border-neutral-900">
                      <Check size={8} className="text-white dark:text-black" />
                    </div>
                  )}
                </Link>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${user.username}`}
                    className="font-medium text-black dark:text-white hover:underline truncate block"
                  >
                    {user.name}
                  </Link>
                  <p className="text-sm text-neutral-500 truncate">
                    @{user.username}
                  </p>
                  {user.bio && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate mt-0.5">
                      {user.bio}
                    </p>
                  )}
                  {user.mutualFriends > 0 && (
                    <p className="flex items-center gap-1 text-xs text-neutral-500 mt-1">
                      <Users size={12} />
                      {user.mutualFriends} mutual friends
                    </p>
                  )}
                </div>

                {/* Follow Button */}
                <button
                  onClick={() => handleFollow(user._id)}
                  className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-full font-medium flex-shrink-0 transition-colors ${
                    isFollowed
                      ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white border border-neutral-200 dark:border-neutral-700"
                      : "bg-black dark:bg-white text-white dark:text-black"
                  }`}
                >
                  {isFollowed ? (
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
              </div>
            </div>
          );
        })}
      </div>

      {/* See All Link */}
      <Link
        to="/explore/people"
        className="block px-4 py-3 text-center text-sm font-medium text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border-t border-neutral-200 dark:border-neutral-800"
      >
        See all suggestions
      </Link>
    </div>
  );
};

export default SuggestFriends;
