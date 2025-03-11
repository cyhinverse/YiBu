import React from "react";

const AdminHeader = () => {
  return (
    <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex items-center justify-between shadow-lg">
      <img src="/path/to/logo.png" alt="Logo" className="h-8 mr-4" />
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
    </header>
  );
};

export default AdminHeader;
