import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  iconBgClass = 'bg-neutral-100 dark:bg-neutral-800',
  iconColorClass = 'text-neutral-900 dark:text-neutral-100',
  change,
  trend,
  loading,
}) => {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconBgClass} ${iconColorClass}`}>
          {/* Use thinner stroke for modern look */}
          {Icon && <Icon size={22} strokeWidth={1.5} />}
        </div>
        {!loading && change && (
          <div
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              trend === 'up'
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                : trend === 'down'
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                : 'bg-neutral-50 text-neutral-600 dark:bg-neutral-900/20 dark:text-neutral-400'
            }`}
          >
            {trend === 'up' && <TrendingUp size={10} strokeWidth={2.5} />}
            {trend === 'down' && <TrendingDown size={10} strokeWidth={2.5} />}
            {change}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
          {title}
        </p>
        {loading ? (
          <div className="h-8 w-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
        ) : (
          <h3
            className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight truncate"
            title={String(value)}
          >
            {value}
          </h3>
        )}
      </div>
    </div>
  );
};

export default StatCard;
