import React from "react";

const PrivacySettings = () => {
  return (
    <div className="w-full max-w-2xl mx-auto p-8 space-y-10 bg-neutral-50 border border-neutral-200 rounded-xl">
      <h1 className="text-2xl font-semibold text-neutral-800">
        Privacy Settings
      </h1>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Profile Visibility
        </h2>
        <select className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none">
          <option value="public">Public</option>
          <option value="friends">Friends Only</option>
          <option value="private">Private</option>
        </select>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Search Visibility
        </h2>
        <p className="text-sm text-neutral-500">
          Control whether people can find your profile through search engines.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="searchVisibility"
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="searchVisibility"
            className="text-sm text-neutral-700"
          >
            Allow search engines to index my profile
          </label>
        </div>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Data Sharing Preferences
        </h2>
        <p className="text-sm text-neutral-500">
          Choose if you allow us to share data with third-party services for
          personalized experiences.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="dataSharing"
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="dataSharing" className="text-sm text-neutral-700">
            Allow data sharing
          </label>
        </div>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">Blocked Users</h2>
        <p className="text-sm text-neutral-500">
          Manage users you’ve blocked from interacting with you.
        </p>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 border border-neutral-300 rounded-md">
            <span className="text-sm text-neutral-700">
              user123@example.com
            </span>
            <button className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition">
              Unblock
            </button>
          </div>
          <div className="flex justify-between items-center p-3 border border-neutral-300 rounded-md">
            <span className="text-sm text-neutral-700">
              anotheruser@example.com
            </span>
            <button className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition">
              Unblock
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacySettings;
