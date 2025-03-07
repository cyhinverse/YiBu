import React from "react";

const SupportSettings = () => {
  return (
    <div className="w-full max-w-2xl mx-auto p-8 space-y-10 bg-neutral-50 border border-neutral-200 rounded-xl">
      <h1 className="text-2xl font-semibold text-neutral-800">
        Support Settings
      </h1>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Contact Support
        </h2>
        <textarea
          placeholder="Describe your issue..."
          rows={4}
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition">
            Submit Request
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Frequently Asked Questions
        </h2>
        <ul className="space-y-2 text-sm text-neutral-600">
          <li>• How to reset my password?</li>
          <li>• How to delete my account?</li>
          <li>• How to change my email?</li>
          <li>• How to contact support?</li>
        </ul>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            View More FAQs
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Report a Problem
        </h2>
        <input
          type="text"
          placeholder="Subject"
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <textarea
          placeholder="Describe the problem..."
          rows={4}
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition">
            Report Issue
          </button>
        </div>
      </section>
    </div>
  );
};

export default SupportSettings;
