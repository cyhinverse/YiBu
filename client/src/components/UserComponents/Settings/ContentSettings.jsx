import React from "react";

const ContentSettings = () => {
  return (
    <div className="w-full max-w-2xl mx-auto p-8 space-y-10 bg-neutral-50 border border-neutral-200 rounded-xl">
      <h1 className="text-2xl font-semibold text-neutral-800">
        Content Settings
      </h1>

      {/* Language Preferences */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Language Preferences
        </h2>
        <select className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none">
          <option>English</option>
          <option>Vietnamese</option>
          <option>Japanese</option>
          <option>Korean</option>
        </select>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>

      {/* Content Visibility */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Content Visibility
        </h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-neutral-700">
            Show sensitive content
          </span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-neutral-700">
            Show content from unverified accounts
          </span>
        </label>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>

      {/* Autoplay Settings */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Autoplay Videos
        </h2>
        <select className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none">
          <option>Always autoplay</option>
          <option>Autoplay on Wi-Fi only</option>
          <option>Never autoplay</option>
        </select>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>

      {/* Content Filters */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Content Filters
        </h2>
        <input
          type="text"
          placeholder="Enter keywords to filter"
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

export default ContentSettings;
