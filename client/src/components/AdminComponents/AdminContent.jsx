import React from "react";

const AdminContent = () => {
  return (
    <main className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        Welcome to the Admin Dashboard
      </h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-700">This is the main content area.</p>
      </div>
      <section className="mt-8">
        <h3 className="text-xl font-semibold mb-2">Recent Activities</h3>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-700">No recent activities.</p>
        </div>
      </section>
      <section className="mt-8">
        <h3 className="text-xl font-semibold mb-2">User Management</h3>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-700">Manage your users here.</p>
        </div>
      </section>
      <section className="mt-8">
        <h3 className="text-xl font-semibold mb-2">Settings</h3>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-700">Configure your settings here.</p>
        </div>
      </section>
    </main>
  );
};

export default AdminContent;
