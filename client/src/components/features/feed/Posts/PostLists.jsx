import { FileText, PenSquare } from "lucide-react";
import Post from "./Post";

// Fake posts data
const FAKE_POSTS = [
  {
    _id: "1",
    caption:
      "Just shipped a new feature! 🚀 The team has been working hard on this for weeks. Really proud of what we've accomplished together.",
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    likeCount: 234,
    commentCount: 12,
    viewCount: 1520,
    user: {
      name: "Sarah Chen",
      username: "sarahchen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      verified: true,
    },
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600",
      },
    ],
  },
  {
    _id: "2",
    caption: "Coffee and code. That's my morning routine ☕️",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    likeCount: 89,
    commentCount: 5,
    viewCount: 432,
    user: {
      name: "Mike Johnson",
      username: "mikej",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
      verified: false,
    },
    media: [],
  },
  {
    _id: "3",
    caption: "Beautiful sunset from my office window today 🌅",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    likeCount: 567,
    commentCount: 23,
    viewCount: 3200,
    user: {
      name: "Emma Wilson",
      username: "emmaw",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
      verified: true,
    },
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=600",
      },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=600",
      },
    ],
  },
  {
    _id: "4",
    caption:
      "New design system is coming along nicely. Clean, minimal, and elegant. What do you think?",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    likeCount: 1234,
    commentCount: 89,
    viewCount: 8900,
    user: {
      name: "Alex Rivera",
      username: "alexr",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
      verified: true,
    },
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=600",
      },
    ],
  },
  {
    _id: "5",
    caption: "Weekend vibes 🎧",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    likeCount: 45,
    commentCount: 2,
    viewCount: 210,
    user: {
      name: "Jordan Lee",
      username: "jordanl",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
      verified: false,
    },
    media: [],
  },
];

const PostLists = () => {
  const posts = FAKE_POSTS;

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <FileText size={28} className="text-neutral-400" />
        </div>
        <h3 className="text-base font-medium text-black dark:text-white mb-2">
          No posts yet
        </h3>
        <p className="text-xs text-neutral-500 text-center max-w-xs mb-4">
          When there are posts, they'll show up here. Be the first to share
          something!
        </p>
        <button className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity">
          <PenSquare size={14} />
          Create Post
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Post key={post._id} data={post} />
      ))}
    </div>
  );
};

export default PostLists;
