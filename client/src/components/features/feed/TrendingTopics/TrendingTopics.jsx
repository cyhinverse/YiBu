

const TrendingTopics = ({ trendingTopics }) => {
  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="text-lg font-bold font-heading mb-4 text-text-primary tracking-tight">
        Trending Topics
      </h2>

      <div className="space-y-1 overflow-y-auto custom-scrollbar pr-2">
        {trendingTopics.map((topic, index) => (
          <div
            key={index}
            className="group flex items-center justify-between p-2 rounded-lg hover:bg-surface-highlight cursor-pointer transition-all duration-200"
          >
            <span className="text-text-primary font-medium group-hover:text-primary transition-colors text-sm">
              {topic.name}
            </span>
            <span className="text-text-secondary text-xs">
              {topic.posts}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingTopics;
