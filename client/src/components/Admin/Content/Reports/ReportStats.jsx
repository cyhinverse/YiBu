import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import StatCard from '../../Shared/StatCard';

export default function ReportStats({ reports }) {
  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;
  const rejectedCount = reports.filter(r => r.status === 'rejected').length;

  const stats = [
    {
      title: 'Chờ xử lý',
      value: pendingCount,
      icon: AlertTriangle,
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Đã giải quyết',
      value: resolvedCount,
      icon: CheckCircle,
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Đã từ chối',
      value: rejectedCount,
      icon: XCircle,
      bg: 'bg-rose-100 dark:bg-rose-900/30',
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          iconBgClass={stat.bg}
          iconColorClass={stat.iconColor}
          loading={false}
        />
      ))}
    </div>
  );
}
