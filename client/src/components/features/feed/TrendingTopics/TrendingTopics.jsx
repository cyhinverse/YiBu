import TrendingRadar from './TrendingRadar';

const TrendingTopics = ({ trendingTopics = [] }) => {
  if (trendingTopics.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <TrendingRadar trendingTopics={trendingTopics} />
    </div>
  );
};

export default TrendingTopics;
