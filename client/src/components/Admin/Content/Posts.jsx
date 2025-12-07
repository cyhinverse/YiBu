import React, { useState, useEffect, useCallback } from "react";
import { Search, Trash2, Eye, CheckCircle } from "lucide-react";
import AdminService from "../../../services/adminService";
import { AdminTable, StatusBadge, AdminModal } from "../Shared";
import { toast } from "react-hot-toast";

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [filter, setFilter] = useState({ search: "" });

  const fetchPosts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await AdminService.getAllPosts(page, 10, filter);
      if (response && response.code === 1) {
        setPosts(response.data.posts);
        setPagination({
            currentPage: response.data.currentPage,
            totalPages: response.data.totalPages
        });
      }
    } catch (error) {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (postId) => {
      if(window.confirm("Delete this post?")) {
        try {
            await AdminService.deletePost(postId, "Admin deletion");
            toast.success("Post deleted");
            fetchPosts(pagination.currentPage);
        } catch (error) {
            toast.error("Failed to delete post");
        }
      }
  };

  const columns = [
    {
      header: "Author",
      render: (post) => (
        <span className="font-medium">{post.author?.username || "Unknown"}</span>
      )
    },
    {
      header: "Content",
      render: (post) => (
        <div className="max-w-xs truncate" title={post.content}>
            {post.content || <span className="italic text-gray-400">Media only</span>}
        </div>
      )
    },
    { 
      header: "Created", 
      render: (post) => new Date(post.createdAt).toLocaleDateString("vi-VN") 
    },
    { 
        header: "Status",
        render: (post) => <StatusBadge status={post.visibility} />
    },
    {
      header: "Actions",
      render: (post) => (
        <div className="flex gap-2">
          <button 
           onClick={() => handleDelete(post._id)}
           className="p-1 text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Post Management</h2>
      </div>
      
      <AdminTable
        columns={columns}
        data={posts}
        isLoading={loading}
        pagination={{...pagination, onPageChange: (p) => fetchPosts(p)}}
      />
    </div>
  );
};

export default Posts;
