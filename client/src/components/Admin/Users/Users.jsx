import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, MoreVertical, Eye, Ban, Trash2, CheckCircle } from "lucide-react";
import { useDispatch } from "react-redux";
import { getAllUsersAdmin, banUser } from "../../../redux/actions/adminActions";
import { AdminTable, StatusBadge, AdminModal } from "../Shared";
import { toast } from "react-hot-toast";

const Users = () => {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [filter, setFilter] = useState({ search: "", status: "" });
  
  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("7"); // days

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await dispatch(getAllUsersAdmin({ page, limit: 10, filter })).unwrap();
      if (response && response.code === 1) {
        setUsers(response.data.users);
        setPagination({
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages
        });
      }
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [dispatch, filter]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchUsers(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [filter, fetchUsers]);

  const handlePageChange = (page) => {
    fetchUsers(page);
  };

  const handleAction = (type, user) => {
    setSelectedUser(user);
    if (type === 'view') setShowDetailModal(true);
    if (type === 'ban') setShowBanModal(true);
    if (type === 'delete') {
       if (window.confirm("Are you sure you want to delete this user?")) {
         // Call delete API
       }
    }
  };

  const handleBanUser = async () => {
    try {
      await dispatch(banUser({ 
        userId: selectedUser._id, 
        reason: banReason, 
        duration: parseInt(banDuration) 
      })).unwrap();
      
      toast.success("User banned successfully");
      setShowBanModal(false);
      fetchUsers(pagination.currentPage);
    } catch (error) {
      toast.error("Failed to ban user");
    }
  };

  const columns = [
    { 
      header: "User", 
      render: (user) => (
        <div className="flex items-center">
            <img src={user.avatar || "https://via.placeholder.com/40"} alt="" className="w-8 h-8 rounded-full mr-3" />
            <div>
                <div className="font-medium text-gray-900">{user.username}</div>
                <div className="text-gray-500 text-xs">{user.email}</div>
            </div>
        </div>
      )
    },
    { header: "Role", accessor: "role", render: (user) => <span className="capitalize">{user.role}</span> },
    { header: "Status", accessor: "accountStatus", render: (user) => <StatusBadge status={user.accountStatus} /> },
    { 
      header: "Joined", 
      accessor: "createdAt", 
      render: (user) => new Date(user.createdAt).toLocaleDateString("vi-VN") 
    },
    {
      header: "Actions",
      render: (user) => (
        <div className="flex gap-2">
          <button onClick={() => handleAction('view', user)} className="p-1 hover:bg-gray-100 rounded text-blue-600">
            <Eye size={16} />
          </button>
          <button onClick={() => handleAction('ban', user)} className="p-1 hover:bg-gray-100 rounded text-red-600">
            <Ban size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter.search}
              onChange={(e) => setFilter({...filter, search: e.target.value})}
            />
          </div>
        </div>
      </div>

      <AdminTable 
        columns={columns} 
        data={users} 
        isLoading={loading}
        pagination={{...pagination, onPageChange: handlePageChange}}
      />

      {/* User Detail Modal */}
      <AdminModal 
        isOpen={showDetailModal} 
        onClose={() => setShowDetailModal(false)}
        title="User Details"
      >
        {selectedUser && (
           <div className="space-y-4">
               <div className="flex items-center gap-4">
                   <img src={selectedUser.avatar} className="w-20 h-20 rounded-full" alt="" />
                   <div>
                       <h3 className="text-xl font-bold">{selectedUser.username}</h3>
                       <p className="text-gray-500">{selectedUser.email}</p>
                   </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div className="p-3 bg-gray-50 rounded">
                       <span className="text-xs text-gray-500 block">ID</span>
                       <span className="font-mono text-sm">{selectedUser._id}</span>
                   </div>
                   <div className="p-3 bg-gray-50 rounded">
                       <span className="text-xs text-gray-500 block">Status</span>
                       <StatusBadge status={selectedUser.accountStatus} />
                   </div>
               </div>
           </div>
        )}
      </AdminModal>

      {/* Ban User Modal */}
      <AdminModal
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        title={`Ban User: ${selectedUser?.username}`}
        footer={
           <>
             <button onClick={() => setShowBanModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
             <button onClick={handleBanUser} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Confirm Ban</button>
           </>
        }
      >
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Duration (days)</label>
                <select 
                  className="w-full border rounded p-2"
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                >
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                    <option value="36500">Permanent</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea 
                  className="w-full border rounded p-2"
                  rows="3"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Why is this user being banned?"
                />
            </div>
        </div>
      </AdminModal>
    </div>
  );
};

export default Users;
