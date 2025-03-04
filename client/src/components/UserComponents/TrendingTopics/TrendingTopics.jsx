import React from "react";

const TrendingTopics = ({ trendingTopics }) => {
  return (
    <div className="w-[20%] h-full bg-white shadow-xl border-gray-300 border rounded-t-xl rounded-br-xl px-5 py-5">
      <h1 className="text-center text-2xl font-bold mb-5 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        Trending topics
      </h1>

      <div className="space-y-3">
        {trendingTopics.map((topic, index) => (
          <div
            key={index}
            className="bg-gray-100 p-3 rounded-lg flex items-center justify-between hover:bg-gray-200 cursor-pointer transition"
          >
            <span className="text-blue-600 font-medium">{topic.name}</span>
            <span className="text-gray-500 text-sm">{topic.posts} posts</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingTopics;
