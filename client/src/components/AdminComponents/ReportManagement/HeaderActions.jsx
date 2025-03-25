import React from "react";
import { RefreshCw, Loader } from "lucide-react";

const HeaderActions = ({ onRefresh, loading }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
        onClick={onRefresh}
        disabled={loading}
        title="Làm mới dữ liệu"
      >
        {loading ? (
          <Loader size={18} className="animate-spin" />
        ) : (
          <RefreshCw size={18} />
        )}
      </button>
    </div>
  );
};

export default HeaderActions;
