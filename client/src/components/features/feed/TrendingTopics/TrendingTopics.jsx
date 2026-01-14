import { TrendingUp, Hash, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';
import TrendingCircles from './TrendingCircles';

const TrendingTopics = ({ trendingTopics = [] }) => {
  if (trendingTopics.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <TrendingCircles trendingTopics={trendingTopics} />
    </div>
  );
};

export default TrendingTopics;
