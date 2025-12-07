import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import AdminService from "../../../services/adminService";
import { AdminTable, StatusBadge } from "../Shared";
import { toast } from "react-hot-toast";

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

    const fetchReports = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await AdminService.getAllReports(page, 10);
            if (response && response.code === 1) {
                setReports(response.data.reports);
            }
        } catch (error) {
            toast.error("Failed to fetch reports");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    const handleAction = async (id, action) => {
        try {
            if (action === 'resolve') {
                await AdminService.resolveReport(id, 'resolved', 'Admin resolved');
            } else {
                await AdminService.dismissReport(id, 'Dismissed');
            }
            toast.success("Report updated");
            fetchReports(pagination.currentPage);
        } catch (error) {
            toast.error("Action failed");
        }
    };

    const columns = [
        { header: "Reporter", render: (r) => r.reporter?.username || "Anonymous" },
        { header: "Target", render: (r) => r.targetType },
        { header: "Reason", accessor: "reason" },
        { header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        {
            header: "Actions",
            render: (r) => (
                <div className="flex gap-2">
                    {r.status === 'pending' && (
                        <>
                            <button onClick={() => handleAction(r._id, 'resolve')} className="text-green-600 hover:bg-green-50 p-1 rounded" title="Resolve">
                                <CheckCircle size={18} />
                            </button>
                            <button onClick={() => handleAction(r._id, 'dismiss')} className="text-gray-500 hover:bg-gray-100 p-1 rounded" title="Dismiss">
                                <XCircle size={18} />
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Reports</h2>
            <AdminTable 
                columns={columns} 
                data={reports} 
                isLoading={loading}
                pagination={{...pagination, onPageChange: (p) => fetchReports(p)}}
            />
        </div>
    );
};

export default Reports;
