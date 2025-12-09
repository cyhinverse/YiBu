import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  TrendingUp,
  Hash,
  UserPlus,
  Check,
  X,
  Flame,
  Users,
  Image,
} from "lucide-react";

// Fake trending hashtags
const FAKE_TRENDING = [
  { id: 1, tag: "ReactJS", posts: 12500, category: "Technology" },
  { id: 2, tag: "WebDevelopment", posts: 8900, category: "Technology" },
  { id: 3, tag: "DesignTips", posts: 6700, category: "Design" },
  { id: 4, tag: "AINews", posts: 15200, category: "Technology" },
  { id: 5, tag: "Photography", posts: 9800, category: "Art" },
  { id: 6, tag: "StartupLife", posts: 4300, category: "Business" },
  { id: 7, tag: "Fitness", posts: 11000, category: "Health" },
  { id: 8, tag: "Travel2024", posts: 7600, category: "Travel" },
];

// Fake suggested users
const FAKE_USERS = [
  {
    _id: "u1",
    name: "Sarah Chen",
    username: "sarahchen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    bio: "Product Designer @Company",
    followers: 12500,
    isVerified: true,
  },
  {
    _id: "u2",
    name: "Mike Johnson",
    username: "mikej",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    bio: "Software Engineer | Open Source",
    followers: 8900,
    isVerified: false,
  },
  {
    _id: "u3",
    name: "Emma Wilson",
    username: "emmaw",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    bio: "UI/UX Designer",
    followers: 15200,
    isVerified: true,
  },
];

// Fake explore posts
const FAKE_EXPLORE_POSTS = [
  {
    _id: "e1",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
    likes: 1234,
  },
  {
    _id: "e2",
    image: "https://images.unsplash.com/photo-1579547945413-497e1b99dac0?w=400",
    likes: 856,
  },
  {
    _id: "e3",
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400",
    likes: 2341,
  },
  {
    _id: "e4",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    likes: 1567,
  },
  {
    _id: "e5",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400",
    likes: 943,
  },
  {
    _id: "e6",
    image: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=400",
    likes: 2890,
  },
];

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("trending");
  const [followedUsers, setFollowedUsers] = useState([]);

  const handleFollow = (userId) => {
    setFollowedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const tabs = [
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "people", label: "People", icon: Users },
    { id: "photos", label: "Photos", icon: Image },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-black dark:text-white mb-4">
            Explore
          </h1>

          {/* Search */}
          <div className="relative mb-4">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              placeholder="Search topics, people, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                <X size={14} className="text-neutral-500" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Trending Tab */}
        {activeTab === "trending" && (
          <div className="space-y-2">
            {FAKE_TRENDING.map((item, index) => (
              <Link
                key={item.id}
                to={`/explore/tag/${item.tag}`}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <span className="text-lg font-bold text-neutral-300 dark:text-neutral-600 w-6">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Hash size={16} className="text-neutral-400" />
                    <span className="font-semibold text-black dark:text-white">
                      {item.tag}
                    </span>
                    {index < 3 && (
                      <Flame size={14} className="text-orange-500" />
                    )}
                  </div>
                  <p className="text-sm text-neutral-500">
                    {formatNumber(item.posts)} posts · {item.category}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* People Tab */}
        {activeTab === "people" && (
          <div className="space-y-2">
            {FAKE_USERS.map((user) => {
              const isFollowed = followedUsers.includes(user._id);
              return (
                <div
                  key={user._id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
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
                        <Check
                          size={8}
                          className="text-white dark:text-black"
                        />
                      </div>
                    )}
                  </Link>
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
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                      {formatNumber(user.followers)} followers
                    </p>
                  </div>
                  <button
                    onClick={() => handleFollow(user._id)}
                    className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-full font-medium transition-colors ${
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
              );
            })}
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === "photos" && (
          <div className="grid grid-cols-3 gap-1">
            {FAKE_EXPLORE_POSTS.map((post) => (
              <Link
                key={post._id}
                to={`/post/${post._id}`}
                className="relative aspect-square group overflow-hidden rounded-lg"
              >
                <img
                  src={post.image}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-medium">
                    ♥ {formatNumber(post.likes)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
