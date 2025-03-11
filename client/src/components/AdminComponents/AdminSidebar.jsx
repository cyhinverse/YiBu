import React from "react";
import {
  FaTachometerAlt,
  FaUsers,
  FaCog,
  FaChartBar,
  FaChartPie,
} from "react-icons/fa";

const AdminSidebar = () => {
  return (
    <aside className="bg-gray-800 text-white w-full md:w-64 p-4 h-screen">
      <nav>
        <ul className="space-y-4">
          <li className="flex items-center hover:bg-gray-700 p-2 rounded">
            <FaTachometerAlt className="mr-2" />
            <a href="#" className="hover:underline">
              Dashboard
            </a>
          </li>
          <li className="flex items-center hover:bg-gray-700 p-2 rounded">
            <FaUsers className="mr-2" />
            <a href="#" className="hover:underline">
              Users
            </a>
          </li>
          <li className="flex items-center hover:bg-gray-700 p-2 rounded">
            <FaCog className="mr-2" />
            <a href="#" className="hover:underline">
              Settings
            </a>
          </li>
          <li className="flex items-center hover:bg-gray-700 p-2 rounded">
            <FaChartBar className="mr-2" />
            <a href="#" className="hover:underline">
              Reports
            </a>
          </li>
          <li className="flex items-center hover:bg-gray-700 p-2 rounded">
            <FaChartPie className="mr-2" />
            <a href="#" className="hover:underline">
              Analytics
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
