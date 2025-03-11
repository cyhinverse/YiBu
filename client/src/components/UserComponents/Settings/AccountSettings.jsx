import React from "react";
import Auth from "../../../services/authService";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { logout } from "../../../slices/AuthSlice";
const AccountSettings = () => {
  const dispatch = useDispatch();
  const handleLogout = async () => {
    try {
      const res = await Auth.logout();
      if (res.code === 1) {
        toast.success(res.message);
        dispatch(logout());
      } else {
        toast.error("Logout failed !");
      }
    } catch (error) {
      console.log(`Error ${error}`);
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 space-y-10 bg-neutral-50 border border-neutral-200 rounded-xl">
      <h1 className="text-2xl font-semibold text-neutral-800">
        Account Settings
      </h1>

      {/* Change Email */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">Change Email</h2>
        <input
          type="email"
          placeholder="Enter new email"
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <div className="flex justify-end gap-3">
          <button className="px-5 w-[100px] py-2 cursor-pointer bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
          <button className="px-5 w-[100px] py-2 cursor-pointer bg-purple-400 text-white rounded-md text-sm hover:opacity-75 transition">
            Update
          </button>
        </div>
      </section>

      {/* Change Password */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Change Password
        </h2>
        <input
          type="password"
          placeholder="Current password"
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <input
          type="password"
          placeholder="New password"
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>

      {/* Change Phone */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Change Phone Number
        </h2>
        <input
          type="tel"
          placeholder="New phone number"
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>

      {/* Connected Accounts */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Connected Accounts
        </h2>
        <div className="flex gap-3 flex-wrap">
          <button className="px-4 py-2 border border-neutral-300 rounded-md text-sm hover:bg-neutral-100">
            Google
          </button>
          <button className="px-4 py-2 border border-neutral-300 rounded-md text-sm hover:bg-neutral-100">
            Facebook
          </button>
          <button className="px-4 py-2 border border-neutral-300 rounded-md text-sm hover:bg-neutral-100">
            Apple
          </button>
        </div>
      </section>

      {/* Verify Account */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-neutral-700">Verify Account</h2>
        <p className="text-sm text-neutral-500">
          To unlock advanced features, please verify your account.
        </p>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition">
            Verify Now
          </button>
        </div>
      </section>

      {/* Delete Account */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-red-600">Delete Account</h2>
        <p className="text-sm text-neutral-500">
          This action is irreversible. Your data will be permanently removed.
        </p>
        <div className="flex justify-end space-x-2">
          <button className="px-5 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition">
            Delete Account
          </button>
          <button
            onClick={handleLogout}
            className="px-5 py-2 bg-black text-white rounded-md text-sm hover:bg-red-700 transition"
          >
            Logout Account
          </button>
        </div>
      </section>
    </div>
  );
};

export default AccountSettings;
