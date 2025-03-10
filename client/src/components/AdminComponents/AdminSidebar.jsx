import React from "react";

const AdminSidebar = () => {
  return (
    <aside className="bg-gray-800 text-white w-full md:w-64 p-4">
      <nav>
        <ul>
          <li className="mb-2">
            <a href="#" className="hover:underline">
              Dashboard
            </a>
          </li>
          <li className="mb-2">
            <a href="#" className="hover:underline">
              Users
            </a>
          </li>
          <li className="mb-2">
            <a href="#" className="hover:underline">
              Settings
            </a>
          </li>
          <li className="mb-2">
            <a href="#" className="hover:underline">
              Reports
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
