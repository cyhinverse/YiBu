import React from "react";

const ProfileSettings = () => {
  return (
    <div className="w-full max-w-2xl mx-auto p-8 space-y-10 bg-neutral-50 border border-neutral-200 rounded-xl">
      <h1 className="text-2xl font-semibold text-neutral-800">
        Profile Settings
      </h1>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">Display Name</h2>
        <input
          type="text"
          placeholder="Enter your display name"
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">Bio</h2>
        <textarea
          placeholder="Write something about yourself"
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
          rows="4"
        ></textarea>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">Location</h2>
        <input
          type="text"
          placeholder="City, Country"
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Personal Website
        </h2>
        <input
          type="url"
          placeholder="https://yourwebsite.com"
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Gender & Birthday
        </h2>
        <select className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none">
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <input
          type="date"
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">Interests</h2>
        <textarea
          placeholder="E.g., Music, Travel, Coding..."
          className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
          rows="3"
        ></textarea>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition">
            Save
          </button>
        </div>
      </section>
    </div>
  );
};

export default ProfileSettings;
