import { useState } from "react";
import { Bookmark, Grid, List, X, Trash2 } from "lucide-react";
import Post from "../../feed/Posts/Post";

// Fake saved posts
const FAKE_SAVED_POSTS = [
  {
    _id: "sp1",
    caption: "Amazing sunset view from the mountains! 🌄",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    likeCount: 456,
    commentCount: 23,
    viewCount: 2340,
    user: {
      _id: "u1",
      name: "Sarah Chen",
      username: "sarahchen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    },
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
      },
    ],
  },
  {
    _id: "sp2",
    caption: "Just finished this new design project ✨",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    likeCount: 234,
    commentCount: 12,
    viewCount: 1520,
    user: {
      _id: "u2",
      name: "Mike Johnson",
      username: "mikej",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    },
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=600",
      },
    ],
  },
  {
    _id: "sp3",
    caption: "Coffee and code - perfect morning ☕️",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    likeCount: 89,
    commentCount: 5,
    viewCount: 432,
    user: {
      _id: "u3",
      name: "Emma Wilson",
      username: "emmaw",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    },
    media: [],
  },
];

const SavePosts = () => {
  const [posts, setPosts] = useState(FAKE_SAVED_POSTS);
  const [viewMode, setViewMode] = useState("list");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUnsave = (postId) => {
    setSelectedPost(postId);
    setShowDeleteModal(true);
  };

  const confirmUnsave = () => {
    setLoading(true);
    setTimeout(() => {
      setPosts((prev) => prev.filter((post) => post._id !== selectedPost));
      setShowDeleteModal(false);
      setSelectedPost(null);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Bookmark size={24} className="text-black dark:text-white" />
            <div>
              <h1 className="text-lg font-bold text-black dark:text-white">
                Saved Posts
              </h1>
              <p className="text-sm text-neutral-500">
                {posts.length} saved items
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <Grid size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
          <Bookmark size={48} className="mb-4 text-neutral-300" />
          <h2 className="text-lg font-semibold text-black dark:text-white mb-2">
            No saved posts
          </h2>
          <p className="text-sm">Posts you save will appear here</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {posts.map((post) => (
            <div key={post._id} className="relative group">
              <Post data={post} />
              <button
                onClick={() => handleUnsave(post._id)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-neutral-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 p-1">
          {posts.map((post) => (
            <div
              key={post._id}
              className="relative aspect-square bg-neutral-100 dark:bg-neutral-800 group cursor-pointer overflow-hidden"
            >
              {post.media?.[0]?.url ? (
                <img
                  src={post.media[0].url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2">
                  <p className="text-xs text-neutral-500 line-clamp-3 text-center">
                    {post.caption}
                  </p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleUnsave(post._id)}
                  className="p-2 rounded-full bg-white/20 hover:bg-red-500 transition-colors"
                >
                  <Trash2 size={20} className="text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black dark:text-white">
                Remove from saved?
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X size={20} className="text-neutral-500" />
              </button>
            </div>
            <p className="text-neutral-500 mb-6">
              This post will be removed from your saved items.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-black dark:text-white font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnsave}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loading ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavePosts;
