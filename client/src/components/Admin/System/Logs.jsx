import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, RefreshCw, Calendar, Download } from "lucide-react";
// import AdminService from "../../../services/adminService";
import { AdminTable, StatusBadge } from "../Shared";
import { toast } from "react-hot-toast";

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [filter, setFilter] = useState({ 
    search: "", 
    level: "", 
    module: "",
    startDate: "",
    endDate: ""
  });

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      // const response = await AdminService.getSystemLogs(page, 10, filter);
      // Mock response for now as action is missing
      const response = { code: 1, data: { logs: [], pagination: { currentPage: 1, totalPages: 1 } } };
      
      if (response && response.code === 1) {
        setLogs(response.data.logs || []);
        setPagination({
          currentPage: response.data.pagination?.currentPage || 1,
          totalPages: response.data.pagination?.totalPages || 1
        });
      }
    } catch (error) {
      toast.error("Failed to load system logs");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchLogs(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchLogs]); // filter is included in fetchLogs dependency

  const handleExport = () => {
    toast.success("Exporting logs...");
    // Implement CSV export logic here if needed
  };

  const columns = [
    { 
      header: "Level", 
      render: (log) => <StatusBadge status={log.level} />
    },
    { header: "Module", accessor: "module" },
    { header: "Action", accessor: "action" },
    { 
      header: "Details", 
      render: (log) => (
        <span className="text-sm text-gray-600 truncate max-w-xs block" title={JSON.stringify(log.details)}>
          {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
        </span>
      )
    },
    { 
      header: "User", 
      render: (log) => log.user?.username || "System"
    },
    { 
      header: "Time", 
      render: (log) => new Date(log.createdAt).toLocaleString("vi-VN") 
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">System Logs</h2>
        
        <div className="flex flex-wrap gap-2">
            <button onClick={() => fetchLogs(pagination.currentPage)} className="p-2 bg-white border rounded hover:bg-gray-50">
                <RefreshCw size={18} />
            </button>
            <button onClick={handleExport} className="p-2 bg-green-600 text-white rounded hover:bg-green-700">
                <Download size={18} />
            </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center border rounded px-3 py-2 bg-gray-50">
            <Search size={16} className="text-gray-400 mr-2" />
            <input 
                type="text" 
                placeholder="Search logs..." 
                className="bg-transparent focus:outline-none text-sm"
                value={filter.search}
                onChange={(e) => setFilter({...filter, search: e.target.value})}
            />
        </div>
        
        <select 
            className="border rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none"
            value={filter.level}
            onChange={(e) => setFilter({...filter, level: e.target.value})}
        >
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
        </select>

        <select 
            className="border rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none"
            value={filter.module}
            onChange={(e) => setFilter({...filter, module: e.target.value})}
        >
            <option value="">All Modules</option>
            <option value="auth">Auth</option>
            <option value="user">User</option>
            <option value="post">Post</option>
            <option value="admin">Admin</option>
        </select>

        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">From:</span>
            <input 
                type="date" 
                className="border rounded px-2 py-1 text-sm"
                value={filter.startDate}
                onChange={(e) => setFilter({...filter, startDate: e.target.value})}
            />
        </div>
      </div>

      <AdminTable 
        columns={columns} 
        data={logs} 
        isLoading={loading}
        pagination={{...pagination, onPageChange: (p) => fetchLogs(p)}}
      />
    </div>
  );
};

export default Logs;
