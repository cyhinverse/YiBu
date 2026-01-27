import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  change,
  trend,
  loading,
  color = 'neutral',
  iconBgClass,
}) => {
  const colorStyles = {
    neutral:
      'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
    primary:
      'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400',
    success:
      'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning:
      'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    danger: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-2.5 rounded-xl ${
            iconBgClass ? iconBgClass : colorStyles[color]
          }`}
        >
          {Icon && <Icon size={20} strokeWidth={1.5} />}
        </div>

        {!loading && change && (
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              trend === 'up'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : trend === 'down'
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
            }`}
          >
            {trend === 'up' && <TrendingUp size={12} strokeWidth={2} />}
            {trend === 'down' && <TrendingDown size={12} strokeWidth={2} />}
            {change}
          </div>
        )}
      </div>

      <div>
        {loading ? (
          <>
            <div className="h-4 w-20 bg-neutral-100 dark:bg-neutral-800 rounded mb-2 animate-pulse" />
            <div className="h-8 w-28 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
          </>
        ) : (
          <>
            <p className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              {title}
            </p>
            <h3 className="text-2xl font-semibold text-neutral-800 dark:text-white tracking-tight">
              {value}
            </h3>
          </>
        )}
      </div>
    </div>
  );
};

export default StatCard;
