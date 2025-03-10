import React from "react";

const TrendingTopics = ({ trendingTopics }) => {
  return (
    <div className="bg-white shadow-xl border-gray-300 border rounded-xl p-4">
      <h1 className="text-center text-xl md:text-2xl font-bold mb-4 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        Trending Topics
      </h1>

      <div className="space-y-3">
        {trendingTopics.map((topic, index) => (
          <div
            key={index}
            className="bg-gray-100 p-3 rounded-lg flex items-center justify-between hover:bg-gray-200 cursor-pointer transition text-sm md:text-base"
          >
            <span className="text-blue-600 font-medium">{topic.name}</span>
            <span className="text-gray-500">{topic.posts} posts</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingTopics;
