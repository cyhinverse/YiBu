import React, { useState, useEffect, useCallback } from "react";
import AdminService from "../../../services/adminService";
import { AdminTable, StatusBadge } from "../Shared";
import { toast } from "react-hot-toast";

const BannedAccounts = () => {
    const [bannedUsers, setBannedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

    const fetchBanned = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await AdminService.getBannedAccounts(page, 10);
            if (response && response.code === 1) {
                setBannedUsers(response.data.users || []); // Assuming API structure
                setPagination({
                    currentPage: response.data.currentPage || 1,
                    totalPages: response.data.totalPages || 1
                });
            }
        } catch (error) {
            toast.error("Failed to fetch banned accounts");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBanned(); }, [fetchBanned]);

    const handleUnban = async (userId) => {
        if(window.confirm("Unban this user?")) {
            try {
                await AdminService.unbanUser(userId);
                toast.success("User unbanned");
                fetchBanned(pagination.currentPage);
            } catch (error) {
                toast.error("Failed to unban user");
            }
        }
    };

    const columns = [
        { header: "User", render: (u) => u.username },
        { header: "Email", accessor: "email" },
        { header: "Ban Reason", render: (u) => u.banReason || "N/A" },
        { header: "Status", render: (u) => <StatusBadge status="Banned" /> },
        {
            header: "Actions",
            render: (u) => (
                <button 
                  onClick={() => handleUnban(u._id)}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                >
                    Unban
                </button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Banned Accounts</h2>
            <AdminTable 
                columns={columns} 
                data={bannedUsers} 
                isLoading={loading}
                pagination={{...pagination, onPageChange: (p) => fetchBanned(p)}}
            />
        </div>
    );
};

export default BannedAccounts;
