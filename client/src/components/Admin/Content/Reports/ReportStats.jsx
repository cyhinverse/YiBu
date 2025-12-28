import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function ReportStats({ reports }) {
  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;
  const rejectedCount = reports.filter(r => r.status === 'rejected').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="yb-card p-6 flex items-center justify-between border-l-4 border-l-amber-500">
        <div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Chờ xử lý
          </p>
          <p className="text-3xl font-black text-amber-500">{pendingCount}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <AlertTriangle size={24} />
        </div>
      </div>

      <div className="yb-card p-6 flex items-center justify-between border-l-4 border-l-emerald-500">
        <div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Đã giải quyết
          </p>
          <p className="text-3xl font-black text-emerald-500">
            {resolvedCount}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <CheckCircle size={24} />
        </div>
      </div>

      <div className="yb-card p-6 flex items-center justify-between border-l-4 border-l-rose-500">
        <div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Đã từ chối
          </p>
          <p className="text-3xl font-black text-rose-500">{rejectedCount}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <XCircle size={24} />
        </div>
      </div>
    </div>
  );
}
