import { useState } from 'react';
import {
  Activity,
  Server,
  Database,
  HardDrive,
  Cpu,
  Clock,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Wifi,
  BarChart3,
} from 'lucide-react';
import { useSystemHealth } from '@/hooks/useAdminQuery';

const SystemHealth = () => {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const { data: systemHealth, isLoading: loading, refetch } = useSystemHealth();

  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
  };

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'ok':
      case 'connected':
      case 'running':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'warning':
      case 'degraded':
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'error':
      case 'down':
      case 'disconnected':
        return 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500';
    }
  };

  const formatUptime = seconds => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading && !systemHealth) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 size={28} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  const services = [
    {
      name: 'API Server',
      icon: Server,
      status: 'running',
      uptime: 124332,
      latency: '24ms',
    },
    {
      name: 'Database',
      icon: Database,
      status: 'connected',
      uptime: 124332,
      latency: '12ms',
    },
    {
      name: 'Redis Cache',
      icon: Activity,
      status: 'ok',
      hitRate: '98%',
      memory: '256MB',
    },
    {
      name: 'Storage',
      icon: HardDrive,
      status: 'healthy',
      used: '45%',
      free: '550GB',
    },
    { name: 'Socket.IO', icon: Wifi, status: 'connected', connections: 1250 },
    { name: 'Worker', icon: Cpu, status: 'running', load: '45%', queue: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-white flex items-center gap-2">
            <Activity size={20} strokeWidth={1.5} />
            Sức khỏe hệ thống
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Trạng thái và hiệu suất máy chủ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500 bg-white dark:bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5">
            <Clock size={12} />
            {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-500 hover:text-neutral-700 dark:hover:text-white transition-colors"
          >
            <RefreshCcw
              size={18}
              strokeWidth={1.5}
              className={loading ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-neutral-500 uppercase">
                Trạng thái
              </p>
              <p className="text-base font-semibold text-neutral-800 dark:text-white">
                Ổn định
              </p>
            </div>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5">
            <div className="bg-emerald-500 h-1.5 rounded-full w-[95%]"></div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
              <Cpu size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-neutral-500 uppercase">
                CPU
              </p>
              <p className="text-base font-semibold text-neutral-800 dark:text-white">
                45%
              </p>
            </div>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full w-[45%]"></div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-violet-50 dark:bg-violet-500/10 rounded-xl text-violet-600 dark:text-violet-400">
              <BarChart3 size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-neutral-500 uppercase">
                Memory
              </p>
              <p className="text-base font-semibold text-neutral-800 dark:text-white">
                2.4 GB
              </p>
            </div>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5">
            <div className="bg-violet-500 h-1.5 rounded-full w-[60%]"></div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <AlertTriangle size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-neutral-500 uppercase">
                Errors
              </p>
              <p className="text-base font-semibold text-neutral-800 dark:text-white">
                0
              </p>
            </div>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5">
            <div className="bg-amber-500 h-1.5 rounded-full w-[0%]"></div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div>
        <h3 className="text-base font-semibold text-neutral-800 dark:text-white mb-4 flex items-center gap-2">
          <Server size={18} strokeWidth={1.5} />
          Dịch vụ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-600 dark:text-neutral-300">
                    <service.icon size={18} strokeWidth={1.5} />
                  </div>
                  <span className="font-medium text-neutral-800 dark:text-white">
                    {service.name}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-full ${getStatusColor(
                    service.status
                  )}`}
                >
                  {service.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                {service.uptime && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Uptime</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-200">
                      {formatUptime(service.uptime)}
                    </span>
                  </div>
                )}
                {service.latency && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Latency</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-200">
                      {service.latency}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
