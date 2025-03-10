import React from "react";

const AdminHeader = () => {
  return (
    <header className="bg-purple-600 text-white p-4 flex items-center justify-between">
      <img src="/path/to/logo.png" alt="Logo" className="h-8" />
      <h1 className="text-2xl">Admin Dashboard</h1>
    </header>
  );
};

export default AdminHeader;
