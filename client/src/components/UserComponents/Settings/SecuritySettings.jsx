import React from "react";

const SecuritySettings = () => {
  return (
    <div className="w-full max-w-2xl mx-auto p-8 space-y-10 bg-neutral-50 border border-neutral-200 rounded-xl">
      <h1 className="text-2xl font-semibold text-neutral-800">
        Security Settings
      </h1>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Two-Factor Authentication (2FA)
        </h2>
        <p className="text-sm text-neutral-500">
          Add an extra layer of security to your account by enabling 2FA.
        </p>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition">
            Enable 2FA
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">Login Alerts</h2>
        <p className="text-sm text-neutral-500">
          Get notified when we detect a new login to your account.
        </p>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-neutral-700">
            Email me about new logins
          </span>
        </label>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Trusted Devices
        </h2>
        <p className="text-sm text-neutral-500">
          Manage devices that you trust and have logged in from.
        </p>
        <ul className="text-sm text-neutral-700 space-y-2">
          <li>• MacBook Pro - Last active: 2 days ago</li>
          <li>• iPhone 13 - Last active: Yesterday</li>
          <li>• Windows PC - Last active: 1 week ago</li>
        </ul>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition">
            Remove All Devices
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Security Questions
        </h2>
        <p className="text-sm text-neutral-500">
          Update your security questions for account recovery.
        </p>
        <input
          type="text"
          placeholder="Your favorite childhood teacher's name"
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>
    </div>
  );
};

export default SecuritySettings;
