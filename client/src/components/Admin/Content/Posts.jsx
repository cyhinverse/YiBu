import { useState } from "react";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Trash2,
  Flag,
  Image,
  Video,
  FileText,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";

const FAKE_POSTS = [
  {
    id: 1,
    author: {
      name: "Nguyễn Văn A",
      username: "@nguyenvana",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    content:
      "Hôm nay trời đẹp quá, ra ngoài chụp ảnh thôi! 📸 #photography #nature",
    type: "image",
    media: ["https://picsum.photos/400/300?random=1"],
    likes: 234,
    comments: 45,
    shares: 12,
    status: "active",
    createdAt: "2024-01-15 10:30",
    reports: 0,
  },
  {
    id: 2,
    author: {
      name: "Trần Thị B",
      username: "@tranthib",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    content: "Video mới về công thức nấu ăn đơn giản cho ngày cuối tuần! 🍳",
    type: "video",
    media: ["https://picsum.photos/400/300?random=2"],
    likes: 567,
    comments: 89,
    shares: 34,
    status: "active",
    createdAt: "2024-01-15 09:15",
    reports: 2,
  },
  {
    id: 3,
    author: {
      name: "Lê Văn C",
      username: "@levanc",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    content:
      "Chia sẻ kinh nghiệm học lập trình web cho người mới bắt đầu. Các bạn có thể tham khảo...",
    type: "text",
    media: [],
    likes: 123,
    comments: 67,
    shares: 45,
    status: "active",
    createdAt: "2024-01-15 08:00",
    reports: 0,
  },
  {
    id: 4,
    author: {
      name: "Phạm Thị D",
      username: "@phamthid",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    content: "Nội dung vi phạm quy định cộng đồng...",
    type: "text",
    media: [],
    likes: 12,
    comments: 3,
    shares: 1,
    status: "hidden",
    createdAt: "2024-01-14 22:30",
    reports: 15,
  },
  {
    id: 5,
    author: {
      name: "Hoàng Văn E",
      username: "@hoangvane",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    content: "Album ảnh du lịch Đà Nẵng 🏖️ Cảnh đẹp và đồ ăn ngon!",
    type: "image",
    media: [
      "https://picsum.photos/400/300?random=3",
      "https://picsum.photos/400/300?random=4",
      "https://picsum.photos/400/300?random=5",
    ],
    likes: 890,
    comments: 156,
    shares: 78,
    status: "active",
    createdAt: "2024-01-14 18:45",
    reports: 0,
  },
  {
    id: 6,
    author: {
      name: "Ngô Thị F",
      username: "@ngothif",
      avatar: "https://i.pravatar.cc/150?img=6",
    },
    content: "Bài viết đang chờ kiểm duyệt do có nội dung nhạy cảm...",
    type: "image",
    media: ["https://picsum.photos/400/300?random=6"],
    likes: 0,
    comments: 0,
    shares: 0,
    status: "pending",
    createdAt: "2024-01-14 16:20",
    reports: 5,
  },
];

const getTypeIcon = (type) => {
  switch (type) {
    case "image":
      return <Image size={16} />;
    case "video":
      return <Video size={16} />;
    default:
      return <FileText size={16} />;
  }
};

const getStatusStyle = (status) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "hidden":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "pending":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    default:
      return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "active":
      return "Hoạt động";
    case "hidden":
      return "Đã ẩn";
    case "pending":
      return "Chờ duyệt";
    default:
      return status;
  }
};

export default function Posts() {
  const [posts, setPosts] = useState(FAKE_POSTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPosts = posts.filter((post) => {
    const matchSearch =
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "all" || post.type === filterType;
    const matchStatus = filterStatus === "all" || post.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const handleDelete = () => {
    setPosts(posts.filter((p) => p.id !== postToDelete?.id));
    setShowDeleteModal(false);
    setPostToDelete(null);
  };

  const handleToggleStatus = (postId) => {
    setPosts(
      posts.map((p) =>
        p.id === postId
          ? { ...p, status: p.status === "active" ? "hidden" : "active" }
          : p
      )
    );
    setActiveDropdown(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Quản lý bài viết
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {filteredPosts.length} bài viết
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
            placeholder="Tìm kiếm bài viết..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            <option value="all">Tất cả loại</option>
            <option value="text">Văn bản</option>
            <option value="image">Hình ảnh</option>
            <option value="video">Video</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="hidden">Đã ẩn</option>
            <option value="pending">Chờ duyệt</option>
          </select>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid gap-4">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
          >
            <div className="flex items-start gap-4">
              {/* Author Avatar */}
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-12 h-12 rounded-full border-2 border-neutral-200 dark:border-neutral-700"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-black dark:text-white">
                        {post.author.name}
                      </h3>
                      <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                        {post.author.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {post.createdAt}
                      </span>
                      <span className="flex items-center gap-1">
                        {getTypeIcon(post.type)}
                        {post.type === "image"
                          ? "Hình ảnh"
                          : post.type === "video"
                          ? "Video"
                          : "Văn bản"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                        post.status
                      )}`}
                    >
                      {getStatusText(post.status)}
                    </span>

                    {post.reports > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <Flag size={12} />
                        {post.reports}
                      </span>
                    )}

                    {/* Actions Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === post.id ? null : post.id
                          )
                        }
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <MoreHorizontal
                          size={18}
                          className="text-neutral-500"
                        />
                      </button>

                      {activeDropdown === post.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-10">
                          <button
                            onClick={() => {
                              setSelectedPost(post);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                          >
                            <Eye size={16} />
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => handleToggleStatus(post.id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                          >
                            <Flag size={16} />
                            {post.status === "active" ? "Ẩn bài" : "Hiện bài"}
                          </button>
                          <button
                            onClick={() => {
                              setPostToDelete(post);
                              setShowDeleteModal(true);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2 text-red-600"
                          >
                            <Trash2 size={16} />
                            Xóa bài
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <p className="mt-3 text-black dark:text-white line-clamp-2">
                  {post.content}
                </p>

                {/* Media Preview */}
                {post.media.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {post.media.slice(0, 3).map((url, idx) => (
                      <div
                        key={idx}
                        className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800"
                      >
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {post.type === "video" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Video size={24} className="text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    {post.media.length > 3 && (
                      <div className="flex-shrink-0 w-24 h-24 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                          +{post.media.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="mt-4 flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <Heart size={16} />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle size={16} />
                    {post.comments}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Share2 size={16} />
                    {post.shares}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Hiển thị {filteredPosts.length} bài viết
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

      {/* View Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black dark:text-white">
                  Chi tiết bài viết
                </h2>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <img
                  src={selectedPost.author.avatar}
                  alt={selectedPost.author.name}
                  className="w-12 h-12 rounded-full border-2 border-neutral-200 dark:border-neutral-700"
                />
                <div>
                  <h3 className="font-semibold text-black dark:text-white">
                    {selectedPost.author.name}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {selectedPost.author.username} • {selectedPost.createdAt}
                  </p>
                </div>
              </div>

              <p className="text-black dark:text-white mb-4">
                {selectedPost.content}
              </p>

              {selectedPost.media.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {selectedPost.media.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt=""
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-6 text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <span className="flex items-center gap-1.5">
                  <Heart size={18} /> {selectedPost.likes} lượt thích
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle size={18} /> {selectedPost.comments} bình luận
                </span>
                <span className="flex items-center gap-1.5">
                  <Share2 size={18} /> {selectedPost.shares} chia sẻ
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black dark:text-white">
                  Xóa bài viết
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  Hành động này không thể hoàn tác
                </p>
              </div>
            </div>

            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Bạn có chắc chắn muốn xóa bài viết của{" "}
              <strong className="text-black dark:text-white">
                {postToDelete?.author.name}
              </strong>
              ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPostToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
