import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import AdminService from "../../services/adminService";

import {
  EmptyState,
  PostListTable,
  PostDetailModal,
  DeletePostModal,
  Pagination,
  SearchAndFilter,
  HeaderActions,
} from "./PostManagement/index";

const PostManagement = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Fetch posts on component mount and when filters/pagination change
  useEffect(() => {
    fetchPosts();
  }, [page, filterStatus]);

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filterObject = {};

      if (searchTerm) {
        filterObject.search = searchTerm;
      }

      // Cập nhật filter, loại bỏ trạng thái approved
      if (filterStatus === "reported") {
        filterObject.reported = true;
      }
      // Loại bỏ điều kiện filter phê duyệt

      const response = await AdminService.getAllPosts(page, 10, filterObject);

      if (response && response.code === 1) {
        console.log("Dữ liệu từ API:", response.data.posts);
        setPosts(response.data.posts);
        setTotalPages(response.data.pagination.totalPages);
        setTotalPosts(response.data.pagination.total);
      } else {
        setError(response?.message || "Đã xảy ra lỗi khi tải bài viết");
        console.error("Error fetching posts:", response);
      }
    } catch (error) {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPosts();
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setPage(1); // Reset to first page when searching
      fetchPosts();
    }
  };

  const handleViewPost = (post) => {
    console.log("Chi tiết bài viết:", post);
    console.log("Nội dung bài viết:", post.caption);
    setSelectedPost(post);
    setShowPostDetail(true);
  };

  const handleDeleteClick = (post) => {
    setSelectedPost(post);
    setDeleteReason("");
    setShowDeleteModal(true);
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;

    setIsLoading(true);
    try {
      const response = await AdminService.deletePost(
        selectedPost._id,
        deleteReason
      );

      if (response && response.code === 1) {
        // Remove post from local state
        setPosts(posts.filter((post) => post._id !== selectedPost._id));
        alert("Xóa bài viết thành công");
        setShowDeleteModal(false);
      } else {
        alert(
          "Không thể xóa bài viết: " +
            (response?.message || "Lỗi không xác định")
        );
      }
    } catch (error) {
      console.error("Delete post error:", error);
      alert("Lỗi khi xóa bài viết: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filterValue) => {
    setFilterStatus(filterValue);
    setPage(1);
    setShowFilterMenu(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <HeaderActions handleRefresh={handleRefresh} isLoading={isLoading} />

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          <p>{error}</p>
        </div>
      )}

      <SearchAndFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        handleFilterChange={handleFilterChange}
        handleSearch={handleSearch}
        showFilterMenu={showFilterMenu}
        setShowFilterMenu={setShowFilterMenu}
      />

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <RefreshCw className="animate-spin h-8 w-8 text-blue-500 mr-3" />
            <span className="text-gray-600">Đang tải dữ liệu...</span>
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            title={
              searchTerm ? "Không tìm thấy kết quả" : "Chưa có bài viết nào"
            }
            message={
              searchTerm
                ? "Không tìm thấy bài viết nào phù hợp với tìm kiếm hoặc bộ lọc."
                : "Hiện tại chưa có bài viết nào trong hệ thống."
            }
          />
        ) : (
          <PostListTable
            posts={posts}
            onViewPost={handleViewPost}
            onDeleteClick={handleDeleteClick}
          />
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalPosts}
        pageSize={10}
        onPageChange={setPage}
      />

      {/* Post Detail Modal */}
      <PostDetailModal
        isOpen={showPostDetail}
        post={selectedPost}
        onClose={() => setShowPostDetail(false)}
        onDelete={(post) => {
          setShowPostDetail(false);
          handleDeleteClick(post);
        }}
      />

      {/* Delete Post Modal */}
      <DeletePostModal
        isOpen={showDeleteModal}
        post={selectedPost}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeletePost}
        deleteReason={deleteReason}
        setDeleteReason={setDeleteReason}
        isLoading={isLoading}
      />
    </div>
  );
};

export default PostManagement;
