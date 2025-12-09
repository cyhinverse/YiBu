import { useState } from "react";
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  Bookmark,
  Eye,
  TrendingUp,
  Activity,
} from "lucide-react";

const FAKE_INTERACTIONS = [
  {
    id: 1,
    user: {
      name: "Nguyễn Văn A",
      username: "@nguyenvana",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    type: "like",
    target: {
      type: "post",
      preview: "Hôm nay trời đẹp quá, ra ngoài chụp ảnh thôi...",
      author: "Trần Thị B",
    },
    createdAt: "2024-01-15 10:30",
  },
  {
    id: 2,
    user: {
      name: "Trần Thị B",
      username: "@tranthib",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    type: "comment",
    target: {
      type: "post",
      preview: "Video mới về công thức nấu ăn đơn giản...",
      author: "Lê Văn C",
    },
    content: "Công thức này dễ làm quá! 👍",
    createdAt: "2024-01-15 10:15",
  },
  {
    id: 3,
    user: {
      name: "Lê Văn C",
      username: "@levanc",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    type: "follow",
    target: {
      type: "user",
      name: "Phạm Thị D",
      username: "@phamthid",
    },
    createdAt: "2024-01-15 09:45",
  },
  {
    id: 4,
    user: {
      name: "Phạm Thị D",
      username: "@phamthid",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    type: "share",
    target: {
      type: "post",
      preview: "Chia sẻ kinh nghiệm học lập trình web cho người mới...",
      author: "Hoàng Văn E",
    },
    createdAt: "2024-01-15 09:30",
  },
  {
    id: 5,
    user: {
      name: "Hoàng Văn E",
      username: "@hoangvane",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    type: "save",
    target: {
      type: "post",
      preview: "Album ảnh du lịch Đà Nẵng 🏖️ Cảnh đẹp và đồ ăn ngon!",
      author: "Ngô Thị F",
    },
    createdAt: "2024-01-15 09:00",
  },
  {
    id: 6,
    user: {
      name: "Ngô Thị F",
      username: "@ngothif",
      avatar: "https://i.pravatar.cc/150?img=6",
    },
    type: "like",
    target: {
      type: "comment",
      preview: "Cảnh đẹp thật! Bạn chụp ở đâu vậy?",
      author: "Đặng Văn G",
    },
    createdAt: "2024-01-15 08:45",
  },
  {
    id: 7,
    user: {
      name: "Đặng Văn G",
      username: "@dangvang",
      avatar: "https://i.pravatar.cc/150?img=7",
    },
    type: "comment",
    target: {
      type: "post",
      preview: "Review quán cafe mới mở ở quận 1...",
      author: "Nguyễn Văn A",
    },
    content: "Quán này đẹp lắm, cuối tuần mình sẽ ghé!",
    createdAt: "2024-01-15 08:30",
  },
  {
    id: 8,
    user: {
      name: "Vũ Thị H",
      username: "@vuthih",
      avatar: "https://i.pravatar.cc/150?img=8",
    },
    type: "follow",
    target: {
      type: "user",
      name: "Trần Thị B",
      username: "@tranthib",
    },
    createdAt: "2024-01-15 08:00",
  },
  {
    id: 9,
    user: {
      name: "Bùi Văn I",
      username: "@buivani",
      avatar: "https://i.pravatar.cc/150?img=9",
    },
    type: "share",
    target: {
      type: "post",
      preview: "Tips học tiếng Anh hiệu quả cho người đi làm...",
      author: "Lê Văn C",
    },
    createdAt: "2024-01-15 07:45",
  },
  {
    id: 10,
    user: {
      name: "Cao Thị K",
      username: "@caothik",
      avatar: "https://i.pravatar.cc/150?img=10",
    },
    type: "save",
    target: {
      type: "post",
      preview: "Hướng dẫn tự làm bánh tại nhà cực đơn giản...",
      author: "Phạm Thị D",
    },
    createdAt: "2024-01-15 07:30",
  },
];

const STATS = {
  likes: 1234,
  comments: 567,
  shares: 234,
  follows: 89,
  saves: 156,
};

const getInteractionIcon = (type) => {
  switch (type) {
    case "like":
      return <Heart size={18} className="text-red-500" fill="#ef4444" />;
    case "comment":
      return <MessageCircle size={18} className="text-blue-500" />;
    case "share":
      return <Share2 size={18} className="text-green-500" />;
    case "follow":
      return <UserPlus size={18} className="text-purple-500" />;
    case "save":
      return <Bookmark size={18} className="text-yellow-500" />;
    default:
      return <Activity size={18} className="text-neutral-500" />;
  }
};

const getInteractionText = (type) => {
  switch (type) {
    case "like":
      return "đã thích";
    case "comment":
      return "đã bình luận";
    case "share":
      return "đã chia sẻ";
    case "follow":
      return "đã theo dõi";
    case "save":
      return "đã lưu";
    default:
      return "";
  }
};

const getInteractionBg = (type) => {
  switch (type) {
    case "like":
      return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    case "comment":
      return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
    case "share":
      return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    case "follow":
      return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800";
    case "save":
      return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    default:
      return "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700";
  }
};

export default function Interactions() {
  const [interactions] = useState(FAKE_INTERACTIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredInteractions = interactions.filter((interaction) => {
    const matchSearch =
      interaction.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interaction.user.username
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchType = filterType === "all" || interaction.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Hoạt động tương tác
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Theo dõi các tương tác trên nền tảng
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={18} className="text-red-500" fill="#ef4444" />
            <span className="text-red-600 dark:text-red-400 text-sm font-medium">
              Lượt thích
            </span>
          </div>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
            {STATS.likes.toLocaleString()}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle size={18} className="text-blue-500" />
            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              Bình luận
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {STATS.comments.toLocaleString()}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <Share2 size={18} className="text-green-500" />
            <span className="text-green-600 dark:text-green-400 text-sm font-medium">
              Chia sẻ
            </span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {STATS.shares.toLocaleString()}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus size={18} className="text-purple-500" />
            <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">
              Theo dõi
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {STATS.follows.toLocaleString()}
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 border border-yellow-200 dark:border-yellow-800 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Bookmark size={18} className="text-yellow-500" />
            <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
              Lưu bài
            </span>
          </div>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            {STATS.saves.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        >
          <option value="all">Tất cả tương tác</option>
          <option value="like">Lượt thích</option>
          <option value="comment">Bình luận</option>
          <option value="share">Chia sẻ</option>
          <option value="follow">Theo dõi</option>
          <option value="save">Lưu bài</option>
        </select>
      </div>

      {/* Interactions List */}
      <div className="space-y-3">
        {filteredInteractions.map((interaction) => (
          <div
            key={interaction.id}
            className={`rounded-2xl border p-4 ${getInteractionBg(
              interaction.type
            )}`}
          >
            <div className="flex items-start gap-3">
              {/* User Avatar */}
              <img
                src={interaction.user.avatar}
                alt={interaction.user.name}
                className="w-10 h-10 rounded-full border-2 border-white dark:border-neutral-700 flex-shrink-0"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-black dark:text-white">
                    {interaction.user.name}
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                    {interaction.user.username}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm">
                    {getInteractionIcon(interaction.type)}
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {getInteractionText(interaction.type)}
                    </span>
                  </span>
                </div>

                {/* Target */}
                {interaction.target.type === "user" ? (
                  <p className="mt-2 text-sm text-black dark:text-white">
                    <span className="font-medium">
                      {interaction.target.name}
                    </span>{" "}
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {interaction.target.username}
                    </span>
                  </p>
                ) : (
                  <div className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                      "{interaction.target.preview}"
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                      bởi {interaction.target.author}
                    </p>
                  </div>
                )}

                {/* Comment Content */}
                {interaction.content && (
                  <p className="mt-2 text-sm text-black dark:text-white p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                    "{interaction.content}"
                  </p>
                )}

                {/* Time */}
                <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <Calendar size={12} />
                  {interaction.createdAt}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Hiển thị {filteredInteractions.length} tương tác
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="px-4 py-2 text-sm">Trang {currentPage}</span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
