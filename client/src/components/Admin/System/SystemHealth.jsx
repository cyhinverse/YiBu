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
  XCircle,
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

  const getStatusBadge = status => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'ok':
      case 'connected':
      case 'running':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'warning':
      case 'degraded':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'error':
      case 'down':
      case 'disconnected':
        return 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-neutral-50 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700';
    }
  };

  const formatUptime = seconds => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading && !systemHealth) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-neutral-400" />
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
      version: 'v1.2.0',
    },
    {
      name: 'Database',
      icon: Database,
      status: 'connected',
      uptime: 124332,
      latency: '12ms',
      size: '1.2GB',
    },
    {
      name: 'Redis Cache',
      icon: Activity,
      status: 'ok',
      uptime: 124332,
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
    {
      name: 'Socket.IO',
      icon: Wifi,
      status: 'connected',
      connections: 1250,
      active: 854,
    },
    {
      name: 'Worker Node',
      icon: Cpu,
      status: 'running',
      load: '45%',
      queue: 0,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
            <Activity className="text-neutral-900 dark:text-white" size={24} />
            Sức khỏe hệ thống
          </h2>
          <p className="text-neutral-500 font-medium mt-2">
            Theo dõi trạng thái và hiệu suất máy chủ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-800 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center gap-2">
            <Clock size={14} />
            Cập nhật: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            className="p-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-full border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-all active:scale-95"
          >
            <RefreshCcw
              size={18}
              strokeWidth={2.5}
              className={loading ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
                Trạng thái
              </p>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                Ổn định
              </h3>
            </div>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full w-[95%]"></div>
          </div>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2 text-right">
            99.9% uptime
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
              <Cpu size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
                CPU Load
              </p>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                45%
              </h3>
            </div>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-500 h-2 rounded-full w-[45%]"></div>
          </div>
          <p className="text-xs font-medium text-neutral-500 mt-2 text-right">
            4 cores active
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-2xl text-violet-600 dark:text-violet-400">
              <BarChart3 size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
                Memory
              </p>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                2.4 GB
              </h3>
            </div>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
            <div className="bg-violet-500 h-2 rounded-full w-[60%]"></div>
          </div>
          <p className="text-xs font-medium text-neutral-500 mt-2 text-right">
            Total 4.0 GB
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400">
              <AlertTriangle size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
                Errors
              </p>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                0
              </h3>
            </div>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
            <div className="bg-amber-500 h-2 rounded-full w-[0%]"></div>
          </div>
          <p className="text-xs font-medium text-neutral-500 mt-2 text-right">
            Last 24 hours
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
          <Server size={22} />
          Dịch vụ & Thành phần
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl group-hover:scale-105 transition-transform text-neutral-900 dark:text-white">
                    <service.icon size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
                      {service.name}
                    </h3>
                    <div
                      className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full border mt-1 inline-block ${getStatusBadge(
                        service.status
                      )}`}
                    >
                      {service.status}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {service.uptime && (
                  <div className="flex justify-between items-center text-sm border-b border-neutral-100 dark:border-neutral-800 pb-2">
                    <span className="text-neutral-500 font-medium">Uptime</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {formatUptime(service.uptime)}
                    </span>
                  </div>
                )}
                {service.latency && (
                  <div className="flex justify-between items-center text-sm border-b border-neutral-100 dark:border-neutral-800 pb-2">
                    <span className="text-neutral-500 font-medium">
                      Latency
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {service.latency}
                    </span>
                  </div>
                )}
                {service.version && (
                  <div className="flex justify-between items-center text-sm border-b border-neutral-100 dark:border-neutral-800 pb-2">
                    <span className="text-neutral-500 font-medium">
                      Version
                    </span>
                    <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                      {service.version}
                    </span>
                  </div>
                )}
                {service.hitRate && (
                  <div className="flex justify-between items-center text-sm border-b border-neutral-100 dark:border-neutral-800 pb-2">
                    <span className="text-neutral-500 font-medium">
                      Hit Rate
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {service.hitRate}
                    </span>
                  </div>
                )}
                {service.memory && (
                  <div className="flex justify-between items-center text-sm border-b border-neutral-100 dark:border-neutral-800 pb-2">
                    <span className="text-neutral-500 font-medium">Memory</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {service.memory}
                    </span>
                  </div>
                )}
                {service.free && (
                  <div className="flex justify-between items-center text-sm border-b border-neutral-100 dark:border-neutral-800 pb-2">
                    <span className="text-neutral-500 font-medium">
                      Free Space
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {service.free}
                    </span>
                  </div>
                )}
                {service.connections && (
                  <div className="flex justify-between items-center text-sm border-b border-neutral-100 dark:border-neutral-800 pb-2">
                    <span className="text-neutral-500 font-medium">
                      Connections
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {service.connections}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2">
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${
                      service.status === 'running' ||
                      service.status === 'ok' ||
                      service.status === 'connected' ||
                      service.status === 'healthy'
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    } w-full animate-pulse`}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Server Details */}
      {systemHealth?.server && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Server Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-neutral-500">Node Version</p>
              <p className="font-medium text-black dark:text-white">
                {systemHealth.server?.nodeVersion ||
                  systemHealth.nodeVersion ||
                  'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Platform</p>
              <p className="font-medium text-black dark:text-white">
                {systemHealth.server?.platform ||
                  systemHealth.platform ||
                  'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Environment</p>
              <p className="font-medium text-black dark:text-white">
                {systemHealth.server?.environment ||
                  systemHealth.environment ||
                  process.env.NODE_ENV ||
                  'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Timestamp</p>
              <p className="font-medium text-black dark:text-white">
                {systemHealth.timestamp
                  ? new Date(systemHealth.timestamp).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="text-center text-sm text-neutral-400">
        <p>Auto-refreshes every 30 seconds</p>
      </div>
    </div>
  );
};

export default SystemHealth;
