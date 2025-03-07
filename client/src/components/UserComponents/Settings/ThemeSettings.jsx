import React from "react";

const ThemeSettings = () => {
  return (
    <div className="w-full max-w-2xl mx-auto p-8 space-y-10 bg-neutral-50 border border-neutral-200 rounded-xl">
      <h1 className="text-2xl font-semibold text-neutral-800">
        Theme Settings
      </h1>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">Appearance</h2>
        <select className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none">
          <option>System Default</option>
          <option>Light Mode</option>
          <option>Dark Mode</option>
        </select>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">Primary Color</h2>
        <select className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none">
          <option>Purple</option>
          <option>Blue</option>
          <option>Green</option>
          <option>Red</option>
          <option>Orange</option>
        </select>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">Font Size</h2>
        <select className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none">
          <option>Small</option>
          <option>Medium (Default)</option>
          <option>Large</option>
        </select>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>
    </div>
  );
};

export default ThemeSettings;
