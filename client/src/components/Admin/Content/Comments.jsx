import { useState } from "react";
import {
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Flag,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  MessageCircle,
  Heart,
  Reply,
} from "lucide-react";

const FAKE_COMMENTS = [
  {
    id: 1,
    author: {
      name: "Nguyễn Văn A",
      username: "@nguyenvana",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    content: "Bài viết hay quá, cảm ơn bạn đã chia sẻ! 🙏",
    postId: 101,
    postPreview: "Hôm nay trời đẹp quá, ra ngoài chụp ảnh thôi...",
    likes: 45,
    replies: 3,
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
    content: "Tôi không đồng ý với quan điểm này. Theo tôi thì...",
    postId: 102,
    postPreview: "Video mới về công thức nấu ăn đơn giản...",
    likes: 12,
    replies: 8,
    status: "active",
    createdAt: "2024-01-15 09:45",
    reports: 1,
  },
  {
    id: 3,
    author: {
      name: "Lê Văn C",
      username: "@levanc",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    content: "Bình luận vi phạm quy định cộng đồng với ngôn từ thô tục...",
    postId: 103,
    postPreview: "Chia sẻ kinh nghiệm học lập trình web...",
    likes: 0,
    replies: 0,
    status: "hidden",
    createdAt: "2024-01-15 08:30",
    reports: 12,
  },
  {
    id: 4,
    author: {
      name: "Phạm Thị D",
      username: "@phamthid",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    content: "Cảnh đẹp thật! Bạn chụp ở đâu vậy? Cho mình xin địa chỉ với.",
    postId: 101,
    postPreview: "Hôm nay trời đẹp quá, ra ngoài chụp ảnh thôi...",
    likes: 23,
    replies: 5,
    status: "active",
    createdAt: "2024-01-15 07:15",
    reports: 0,
  },
  {
    id: 5,
    author: {
      name: "Hoàng Văn E",
      username: "@hoangvane",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    content: "Spam quảng cáo link không rõ nguồn gốc...",
    postId: 104,
    postPreview: "Album ảnh du lịch Đà Nẵng...",
    likes: 1,
    replies: 0,
    status: "hidden",
    createdAt: "2024-01-14 22:00",
    reports: 8,
  },
  {
    id: 6,
    author: {
      name: "Ngô Thị F",
      username: "@ngothif",
      avatar: "https://i.pravatar.cc/150?img=6",
    },
    content:
      "Công thức này dễ làm quá! Mình đã thử và thành công ngay lần đầu 👍",
    postId: 102,
    postPreview: "Video mới về công thức nấu ăn đơn giản...",
    likes: 67,
    replies: 2,
    status: "active",
    createdAt: "2024-01-14 20:30",
    reports: 0,
  },
  {
    id: 7,
    author: {
      name: "Đặng Văn G",
      username: "@dangvang",
      avatar: "https://i.pravatar.cc/150?img=7",
    },
    content: "Bình luận đang chờ kiểm duyệt do có từ khóa nhạy cảm...",
    postId: 105,
    postPreview: "Bài viết đang chờ kiểm duyệt...",
    likes: 0,
    replies: 0,
    status: "pending",
    createdAt: "2024-01-14 18:45",
    reports: 3,
  },
];

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

export default function Comments() {
  const [comments, setComments] = useState(FAKE_COMMENTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedComment, setSelectedComment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredComments = comments.filter((comment) => {
    const matchSearch =
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.author.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === "all" || comment.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleDelete = () => {
    setComments(comments.filter((c) => c.id !== commentToDelete?.id));
    setShowDeleteModal(false);
    setCommentToDelete(null);
  };

  const handleToggleStatus = (commentId) => {
    setComments(
      comments.map((c) =>
        c.id === commentId
          ? { ...c, status: c.status === "active" ? "hidden" : "active" }
          : c
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
            Quản lý bình luận
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {filteredComments.length} bình luận
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
            placeholder="Tìm kiếm bình luận..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

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

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.map((comment) => (
          <div
            key={comment.id}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
          >
            <div className="flex items-start gap-4">
              {/* Author Avatar */}
              <img
                src={comment.author.avatar}
                alt={comment.author.name}
                className="w-10 h-10 rounded-full border-2 border-neutral-200 dark:border-neutral-700 flex-shrink-0"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-black dark:text-white">
                        {comment.author.name}
                      </h3>
                      <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                        {comment.author.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      <Calendar size={14} />
                      {comment.createdAt}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                        comment.status
                      )}`}
                    >
                      {getStatusText(comment.status)}
                    </span>

                    {comment.reports > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <Flag size={12} />
                        {comment.reports}
                      </span>
                    )}

                    {/* Actions Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === comment.id ? null : comment.id
                          )
                        }
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <MoreHorizontal
                          size={18}
                          className="text-neutral-500"
                        />
                      </button>

                      {activeDropdown === comment.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-10">
                          <button
                            onClick={() => {
                              setSelectedComment(comment);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                          >
                            <Eye size={16} />
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => handleToggleStatus(comment.id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                          >
                            <Flag size={16} />
                            {comment.status === "active" ? "Ẩn" : "Hiện"}
                          </button>
                          <button
                            onClick={() => {
                              setCommentToDelete(comment);
                              setShowDeleteModal(true);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2 text-red-600"
                          >
                            <Trash2 size={16} />
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comment Content */}
                <p className="mt-3 text-black dark:text-white">
                  {comment.content}
                </p>

                {/* Post Reference */}
                <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                    <MessageCircle size={14} />
                    Bình luận tại bài viết:
                  </p>
                  <p className="text-sm text-black dark:text-white mt-1 truncate">
                    "{comment.postPreview}"
                  </p>
                </div>

                {/* Stats */}
                <div className="mt-3 flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <Heart size={14} />
                    {comment.likes} lượt thích
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Reply size={14} />
                    {comment.replies} trả lời
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
          Hiển thị {filteredComments.length} bình luận
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

      {/* View Comment Modal */}
      {selectedComment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black dark:text-white">
                  Chi tiết bình luận
                </h2>
                <button
                  onClick={() => setSelectedComment(null)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <img
                  src={selectedComment.author.avatar}
                  alt={selectedComment.author.name}
                  className="w-12 h-12 rounded-full border-2 border-neutral-200 dark:border-neutral-700"
                />
                <div>
                  <h3 className="font-semibold text-black dark:text-white">
                    {selectedComment.author.name}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {selectedComment.author.username} •{" "}
                    {selectedComment.createdAt}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl mb-4">
                <p className="text-black dark:text-white">
                  {selectedComment.content}
                </p>
              </div>

              <div className="p-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl mb-4">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                  Bài viết gốc:
                </p>
                <p className="text-black dark:text-white text-sm">
                  "{selectedComment.postPreview}"
                </p>
              </div>

              <div className="flex items-center gap-4 text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <span className="flex items-center gap-1.5">
                  <Heart size={16} /> {selectedComment.likes}
                </span>
                <span className="flex items-center gap-1.5">
                  <Reply size={16} /> {selectedComment.replies}
                </span>
                {selectedComment.reports > 0 && (
                  <span className="flex items-center gap-1.5 text-red-500">
                    <Flag size={16} /> {selectedComment.reports} báo cáo
                  </span>
                )}
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
                  Xóa bình luận
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  Hành động này không thể hoàn tác
                </p>
              </div>
            </div>

            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Bạn có chắc chắn muốn xóa bình luận của{" "}
              <strong className="text-black dark:text-white">
                {commentToDelete?.author.name}
              </strong>
              ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCommentToDelete(null);
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
