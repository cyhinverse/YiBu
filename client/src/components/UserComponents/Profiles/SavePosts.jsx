import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SAVE_POST from "../../../services/savePostService";
import {
  setSavedPosts,
  setLoading,
  setError,
  removeSavedPost,
} from "../../../slices/SavePostSlice";
import Post from "../Posts/Post";
import { Bookmark, Loader2, Trash2, X, Filter, Grid, List } from "lucide-react";
import { toast } from "react-hot-toast";
import "./index.css";

const SavePosts = () => {
  const dispatch = useDispatch();
  const { savedPosts, loading, error } = useSelector((state) => state.savePost);
  const [selectedPost, setSelectedPost] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleteAll, setIsDeleteAll] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [filterType, setFilterType] = useState("all");

  const processPostData = (post) => {
    if (!post || !post._id) {
      console.error("Invalid post data:", post);
      return null;
    }

    return {
      ...post,
      user: post.user || { name: "Người dùng", avatar: null },
      media: post.media || [],
    };
  };

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        dispatch(setLoading(true));

        const response = await SAVE_POST.GET_SAVED_POSTS(1, 100);
        console.log("API Response:", response.data);

        if (
          response.data?.code === 1 &&
          Array.isArray(response.data?.savedPosts)
        ) {
          const postsArray = response.data.savedPosts;
          console.log("Posts from API:", postsArray.length);

          const validPosts = postsArray
            .map(processPostData)
            .filter((post) => post !== null);

          console.log("Valid processed posts:", validPosts.length);
          dispatch(setSavedPosts(validPosts));
        } else {
          console.error("Invalid response format:", response.data);
          dispatch(setError("Không thể tải bài viết đã lưu"));
        }
      } catch (error) {
        console.error("Lỗi khi tải bài viết đã lưu:", error);
        dispatch(setError("Có lỗi xảy ra khi tải bài viết đã lưu"));
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchSavedPosts();
  }, [dispatch]);

  const handleUnsavePost = async (postId) => {
    try {
      setDeleteLoading(true);
      const response = await SAVE_POST.UNSAVE_POST(postId);
      if (response.data?.code === 1) {
        dispatch(removeSavedPost(postId));
        toast.success("Đã xóa bài viết khỏi danh sách đã lưu");
        if (!isDeleteAll) {
          setShowDeleteConfirm(false);
        }
      } else {
        toast.error("Không thể xóa bài viết đã lưu");
        if (isDeleteAll) {
          setIsDeleteAll(false);
          setShowDeleteConfirm(false);
        }
      }
    } catch (error) {
      console.error("Lỗi khi xóa bài viết đã lưu:", error);
      toast.error("Có lỗi xảy ra khi xóa bài viết đã lưu");
      if (isDeleteAll) {
        setIsDeleteAll(false);
        setShowDeleteConfirm(false);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleteLoading(true);
    setIsDeleteAll(true);

    try {
      let success = 0;
      let failed = 0;

      const deletePromises = savedPosts.map((post) =>
        SAVE_POST.UNSAVE_POST(post._id)
          .then((response) => {
            if (response.data?.code === 1) {
              dispatch(removeSavedPost(post._id));
              success++;
              return true;
            } else {
              failed++;
              return false;
            }
          })
          .catch((error) => {
            console.error(`Lỗi khi xóa bài viết ${post._id}:`, error);
            failed++;
            return false;
          })
      );

      await Promise.all(deletePromises);

      if (success > 0) {
        toast.success(`Đã xóa ${success} bài viết khỏi danh sách đã lưu`);
      }

      if (failed > 0) {
        toast.error(`Không thể xóa ${failed} bài viết`);
      }
    } catch (error) {
      console.error("Lỗi khi xóa tất cả bài viết:", error);
      toast.error("Có lỗi xảy ra khi xóa bài viết");
    } finally {
      setDeleteLoading(false);
      setIsDeleteAll(false);
      setShowDeleteConfirm(false);
    }
  };

  const openDeleteConfirm = (post) => {
    setSelectedPost(post);
    setIsDeleteAll(false);
    setShowDeleteConfirm(true);
  };

  const openDeleteAllConfirm = () => {
    setSelectedPost(null);
    setIsDeleteAll(true);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setSelectedPost(null);
    setIsDeleteAll(false);
  };

  const filteredPosts = savedPosts?.filter((post) => {
    if (filterType === "all") return true;
    if (filterType === "image")
      return post.media?.some((m) => m.type === "image");
    if (filterType === "video")
      return post.media?.some((m) => m.type === "video");
    if (filterType === "text") return !post.media || post.media.length === 0;
    return true;
  });

  if (loading) {
    return (
      <div className="w-full h-full  bg-white ">
        <div className="w-full flex justify-between items-center p-4 border-b border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold">Bài viết đã lưu</h2>
          </div>
        </div>
        <div className="flex-1 w-full h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-3" />
            <p className="text-gray-500">Đang tải bài viết đã lưu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-white">
        <div className="w-full flex justify-between items-center p-4 border-b border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold">Bài viết đã lưu</h2>
          </div>
        </div>
        <div className="flex-1 w-full h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-red-50">
              <X size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Không thể tải bài viết
            </h3>
            <p className="text-gray-500 mb-4 max-w-md">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!savedPosts || !savedPosts.length) {
    return (
      <div className="w-full h-full bg-white">
        <div className="w-full flex justify-between items-center p-4 border-b border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold">Bài viết đã lưu</h2>
            <span className="ml-2 text-sm bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">
              0
            </span>
          </div>
        </div>
        <div className="flex-1 w-full h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="flex flex-col items-center text-center px-4 max-w-md">
            <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-purple-50">
              <Bookmark
                size={40}
                strokeWidth={1.5}
                className="text-purple-400"
              />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              Chưa có bài viết nào được lưu
            </h3>
            <p className="text-gray-500">
              Lưu các bài viết bạn thích để đọc lại sau. Chúng sẽ xuất hiện ở
              đây.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col ">
      {/* Header */}
      <div className="w-full flex justify-between items-center p-4 border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10 rounded-xl">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-semibold">Bài viết đã lưu</h2>
          <span className="ml-2 text-sm bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">
            {savedPosts?.length || 0}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1 px-3 py-1.5 ${
                viewMode === "list"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1 px-3 py-1.5 ${
                viewMode === "grid"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Grid size={16} />
            </button>
          </div>

          {/* Filter dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50">
              <Filter size={16} />
              <span className="text-sm font-medium">
                {filterType === "all" && "Tất cả"}
                {filterType === "image" && "Ảnh"}
                {filterType === "video" && "Video"}
                {filterType === "text" && "Văn bản"}
              </span>
            </button>
            <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20 hidden group-hover:block">
              <button
                onClick={() => setFilterType("all")}
                className={`w-full text-left px-3 py-2 text-sm ${
                  filterType === "all"
                    ? "bg-purple-50 text-purple-700"
                    : "hover:bg-gray-50"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilterType("image")}
                className={`w-full text-left px-3 py-2 text-sm ${
                  filterType === "image"
                    ? "bg-purple-50 text-purple-700"
                    : "hover:bg-gray-50"
                }`}
              >
                Ảnh
              </button>
              <button
                onClick={() => setFilterType("video")}
                className={`w-full text-left px-3 py-2 text-sm ${
                  filterType === "video"
                    ? "bg-purple-50 text-purple-700"
                    : "hover:bg-gray-50"
                }`}
              >
                Video
              </button>
              <button
                onClick={() => setFilterType("text")}
                className={`w-full text-left px-3 py-2 text-sm ${
                  filterType === "text"
                    ? "bg-purple-50 text-purple-700"
                    : "hover:bg-gray-50"
                }`}
              >
                Văn bản
              </button>
            </div>
          </div>

          {/* Delete all button */}
          <button
            onClick={openDeleteAllConfirm}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            title="Xóa tất cả bài viết đã lưu"
            disabled={!savedPosts?.length}
          >
            <Trash2 size={16} />
            <span className="text-sm font-medium">Xóa tất cả</span>
          </button>
        </div>
      </div>

      <div className="flex-1 w-full  max-w-7xl mx-auto">
        {viewMode === "list" ? (
          <div className="bg-white rounded-xl border mt-2 border-gray-200 overflow-hidden shadow-sm h-[calc(100vh-180px)] ">
            <div className="h-full overflow-y-auto custom-scrollbar scroll-save">
              {filteredPosts.map((post) => {
                if (!post || !post._id) return null;

                return (
                  <div
                    key={post._id}
                    className="relative group border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openDeleteConfirm(post)}
                        className="p-2 bg-white border border-gray-200 shadow-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Xóa bài viết đã lưu"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="w-full">
                      {(() => {
                        try {
                          return <Post data={post} isSavedPost={true} />;
                        } catch (error) {
                          console.error("Error rendering post:", error);
                          return (
                            <div className="p-4 bg-red-50 text-red-500">
                              <p>Error displaying post: {post._id}</p>
                              <p className="text-xs">{error.message}</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((post) => {
                if (!post || !post._id) return null;

                const previewMedia =
                  post.media && post.media.length > 0 ? post.media[0] : null;

                return (
                  <div
                    key={post._id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative"
                  >
                    <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openDeleteConfirm(post)}
                        className="p-2 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Xóa bài viết đã lưu"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Media preview */}
                    {previewMedia ? (
                      <div className="relative aspect-video w-full bg-gray-100">
                        {previewMedia.type === "image" ? (
                          <img
                            src={previewMedia.url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : previewMedia.type === "video" ? (
                          <video
                            src={previewMedia.url}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            autoPlay
                          />
                        ) : null}
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-purple-50 flex items-center justify-center">
                        <div className="text-purple-300 text-center p-4">
                          <Bookmark
                            size={32}
                            strokeWidth={1.5}
                            className="mx-auto mb-2"
                          />
                          <p className="text-sm">Bài viết văn bản</p>
                        </div>
                      </div>
                    )}

                    {/* Post info */}
                    <div className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <img
                          src={
                            post.user?.avatar ||
                            "https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1"
                          }
                          alt={post.user?.name || "User"}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {post.user?.name || "Người dùng"}
                          </p>
                        </div>
                      </div>

                      <p className="text-gray-700 line-clamp-2 mb-3">
                        {post.caption || ""}
                      </p>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          {post.media?.length > 0
                            ? `${post.media.length} media`
                            : "Văn bản"}
                        </span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filteredPosts.length === 0 && savedPosts.length > 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Filter size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Không tìm thấy kết quả
            </h3>
            <p className="text-gray-500 max-w-md">
              Không có bài viết nào phù hợp với bộ lọc hiện tại. Hãy thử bộ lọc
              khác.
            </p>
            <button
              onClick={() => setFilterType("all")}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Xem tất cả bài viết
            </button>
          </div>
        )}
      </div>

      {/* Add custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.7);
        }
      `}</style>

      {/* Modal xác nhận xóa */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Xác nhận xóa
              </h3>
              <button
                onClick={closeDeleteConfirm}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {isDeleteAll ? (
              <>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                    <Trash2 size={28} className="text-red-500" />
                  </div>
                </div>
                <p className="mb-6 text-gray-600 text-center">
                  Bạn có chắc chắn muốn xóa tất cả{" "}
                  <span className="font-semibold">
                    {savedPosts.length} bài viết
                  </span>{" "}
                  đã lưu?
                  <br />
                  <span className="text-sm text-gray-500">
                    Hành động này không thể hoàn tác.
                  </span>
                </p>
              </>
            ) : (
              <>
                <div className="mb-4 border border-gray-100 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <img
                      src={
                        selectedPost?.user?.avatar ||
                        "https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1"
                      }
                      alt={selectedPost?.user?.name || "User"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">
                        {selectedPost?.user?.name || "Người dùng"}
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {selectedPost?.caption || ""}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mb-6 text-gray-600">
                  Bạn có chắc chắn muốn xóa bài viết này khỏi danh sách đã lưu?
                </p>
              </>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteConfirm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (isDeleteAll) {
                    handleDeleteAll();
                  } else if (selectedPost) {
                    handleUnsavePost(selectedPost._id);
                  }
                }}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-70 transition-colors flex items-center"
              >
                {deleteLoading && (
                  <Loader2 size={16} className="animate-spin mr-2" />
                )}
                {isDeleteAll ? "Xóa tất cả" : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavePosts;
