import React from "react";

const TrendingTopics = ({ trendingTopics }) => {
  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-heading font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
        Trending Topics
      </h1>

      <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
        {trendingTopics.map((topic, index) => (
          <div
            key={index}
            className="group flex items-center justify-between p-3 rounded-xl bg-background hover:bg-surface-highlight cursor-pointer transition-all duration-200 border border-transparent hover:border-surface-highlight"
          >
            <span className="text-primary font-medium group-hover:text-primary-foreground transition-colors">
              {topic.name}
            </span>
            <span className="text-text-secondary text-sm bg-surface px-2 py-1 rounded-full">
              {topic.posts}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingTopics;
