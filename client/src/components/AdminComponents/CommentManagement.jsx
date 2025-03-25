import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import AdminService from "../../services/adminService";

import {
  EmptyState,
  HeaderActions,
  SearchAndFilter,
  CommentsTable,
  CommentDetailModal,
  DeleteCommentModal,
  Pagination,
} from "./CommentManagement/index";

const CommentManagement = () => {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedComment, setSelectedComment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);

  // Fetch comments on component mount and when filters change
  useEffect(() => {
    fetchComments();
  }, [page, filterType]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      // Create filter object based on current filters
      const filterObject = {};

      if (searchTerm) {
        filterObject.search = searchTerm;
      }

      // Add more filters based on filterType
      if (filterType === "reported") {
        filterObject.reported = true;
      } else if (filterType === "recent") {
        filterObject.sort = "createdAt:-1";
      }

      const response = await AdminService.getAllComments(
        page,
        10,
        filterObject
      );

      if (response && response.code === 1) {
        setComments(response.data.comments);
        setTotalPages(response.data.pagination.totalPages);
        setTotalComments(response.data.pagination.total);
      } else {
        console.error("Error fetching comments:", response);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewComment = (comment) => {
    setSelectedComment(comment);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (comment) => {
    setSelectedComment(comment);
    setDeleteReason("");
    setShowDeleteModal(true);
  };

  const handleDeleteComment = async () => {
    if (!selectedComment) return;

    setIsLoading(true);
    try {
      const response = await AdminService.deleteComment(
        selectedComment._id,
        deleteReason
      );

      if (response && response.code === 1) {
        // Remove comment from local state
        setComments(
          comments.filter((comment) => comment._id !== selectedComment._id)
        );
        alert("Xóa bình luận thành công");
        setShowDeleteModal(false);
      } else {
        alert(
          "Không thể xóa bình luận: " +
            (response?.message || "Lỗi không xác định")
        );
      }
    } catch (error) {
      console.error("Delete comment error:", error);
      alert("Lỗi khi xóa bình luận: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchComments();
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setPage(1); // Reset to first page when searching
      fetchComments();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <HeaderActions handleRefresh={handleRefresh} isLoading={isLoading} />

      <SearchAndFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        handleSearch={handleSearch}
      />

      <div className="overflow-x-auto">
        {comments.length === 0 && !isLoading ? (
          <EmptyState
            title={
              searchTerm ? "Không tìm thấy kết quả" : "Chưa có bình luận nào"
            }
            message={
              searchTerm
                ? "Không tìm thấy bình luận nào phù hợp với tìm kiếm hoặc bộ lọc."
                : "Hiện tại chưa có bình luận nào trong hệ thống."
            }
          />
        ) : (
          <CommentsTable
            comments={comments}
            isLoading={isLoading}
            onViewComment={handleViewComment}
            onDeleteClick={handleDeleteClick}
          />
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalComments}
        pageSize={10}
        onPageChange={setPage}
      />

      {/* Comment Detail Modal */}
      <CommentDetailModal
        isOpen={showDetailModal}
        comment={selectedComment}
        onClose={() => setShowDetailModal(false)}
        onDelete={(comment) => {
          setShowDetailModal(false);
          handleDeleteClick(comment);
        }}
      />

      {/* Delete Comment Modal */}
      <DeleteCommentModal
        isOpen={showDeleteModal}
        comment={selectedComment}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeleteComment}
        deleteReason={deleteReason}
        setDeleteReason={setDeleteReason}
        isLoading={isLoading}
      />
    </div>
  );
};

export default CommentManagement;
