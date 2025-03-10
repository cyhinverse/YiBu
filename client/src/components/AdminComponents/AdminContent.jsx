import React from "react";

const AdminContent = () => {
  return (
    <main className="p-4">
      <h2 className="text-xl mb-4">Welcome to the Admin Dashboard</h2>
      <div className="bg-white p-4 rounded shadow">
        <p>This is the main content area.</p>
      </div>
      <section className="mt-8">
        <h3 className="text-lg mb-2">Recent Activities</h3>
        <div className="bg-white p-4 rounded shadow">
          <p>No recent activities.</p>
        </div>
      </section>
    </main>
  );
};

export default AdminContent;
