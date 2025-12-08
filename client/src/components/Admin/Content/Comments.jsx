import React, { useState, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { getAllCommentsAdmin, deleteCommentAdmin } from "../../../redux/actions/adminActions";
import { AdminTable } from "../Shared";
import { toast } from "react-hot-toast";

const Comments = () => {
    const dispatch = useDispatch();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

    const fetchComments = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await dispatch(getAllCommentsAdmin({ page, limit: 10 })).unwrap();
            if (response && response.code === 1) {
                setComments(response.data.comments);
                setPagination({
                    currentPage: response.data.currentPage,
                    totalPages: response.data.totalPages
                });
            }
        } catch (error) {
            toast.error("Failed to load comments");
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleDelete = async (id) => {
        if(window.confirm("Delete this comment?")) {
            try {
                await dispatch(deleteCommentAdmin({ commentId: id, reason: "Admin Action" })).unwrap();
                toast.success("Comment deleted");
                fetchComments(pagination.currentPage);
            } catch (error) {
                toast.error("Failed to delete comment");
            }
        }
    };

    const columns = [
        { header: "User", render: (c) => c.user?.username || "Unknown" },
        { header: "Content", accessor: "content" },
        { header: "Date", render: (c) => new Date(c.createdAt).toLocaleDateString("vi-VN") },
        { 
            header: "Actions", 
            render: (c) => (
                <button onClick={() => handleDelete(c._id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                    <Trash2 size={16} />
                </button>
            ) 
        }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Comments Management</h2>
            <AdminTable 
                columns={columns} 
                data={comments} 
                isLoading={loading}
                pagination={{...pagination, onPageChange: (p) => fetchComments(p)}}
            />
        </div>
    );
};

export default Comments;
