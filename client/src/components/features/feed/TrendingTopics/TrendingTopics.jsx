import { TrendingUp, Hash, ChevronRight } from "lucide-react";

const TrendingTopics = ({ trendingTopics = [] }) => {
  if (trendingTopics.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      {trendingTopics.map((topic, index) => (
        <div
          key={index}
          className="px-2 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                index === 0
                  ? "bg-primary"
                  : "bg-neutral-100 dark:bg-neutral-800 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700"
              }`}
            >
              {index === 0 ? (
                <TrendingUp size={14} className="text-primary-foreground" />
              ) : (
                <Hash size={14} className="text-neutral-400" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-medium text-black dark:text-white truncate">
                  {topic.name}
                </h3>
                {index === 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-medium bg-primary text-primary-foreground rounded-full">
                    Hot
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-neutral-400">
                  {topic.category || "Trending"}
                </span>
                <span className="text-[11px] text-neutral-400">·</span>
                <span className="text-[11px] text-neutral-500">
                  {topic.posts}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight
              size={16}
              className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrendingTopics;
