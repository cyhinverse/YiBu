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
        return 'text-green-500';
      case 'warning':
      case 'degraded':
        return 'text-yellow-500';
      case 'error':
      case 'down':
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-neutral-400';
    }
  };

  const getStatusIcon = status => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'ok':
      case 'connected':
      case 'running':
        return <CheckCircle2 size={20} className="text-green-500" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle size={20} className="text-yellow-500" />;
      case 'error':
      case 'down':
      case 'disconnected':
        return <XCircle size={20} className="text-red-500" />;
      default:
        return <Clock size={20} className="text-neutral-400" />;
    }
  };

  const getStatusBadge = status => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'ok':
      case 'connected':
      case 'running':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'warning':
      case 'degraded':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      case 'error':
      case 'down':
      case 'disconnected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500';
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

  const formatBytes = bytes => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const healthData = systemHealth || {};

  const healthMetrics = [
    {
      id: 'server',
      label: 'Server Status',
      icon: Server,
      status: healthData.server?.status || healthData.status || 'unknown',
      value: healthData.server?.message || healthData.message || 'Checking...',
    },
    {
      id: 'database',
      label: 'Database',
      icon: Database,
      status: healthData.database?.status || 'unknown',
      value:
        healthData.database?.message || healthData.database?.name || 'MongoDB',
    },
    {
      id: 'api',
      label: 'API Response',
      icon: Wifi,
      status:
        healthData.api?.status || (healthData.timestamp ? 'ok' : 'unknown'),
      value: healthData.api?.latency || 'Active',
    },
    {
      id: 'memory',
      label: 'Memory Usage',
      icon: HardDrive,
      status:
        healthData.memory?.status ||
        (healthData.memory?.usage > 90 ? 'warning' : 'ok'),
      value: healthData.memory?.usage
        ? `${healthData.memory.usage}%`
        : healthData.memory?.used
        ? formatBytes(healthData.memory.used)
        : 'N/A',
    },
    {
      id: 'cpu',
      label: 'CPU Load',
      icon: Cpu,
      status:
        healthData.cpu?.status ||
        (healthData.cpu?.usage > 80 ? 'warning' : 'ok'),
      value: healthData.cpu?.usage
        ? `${healthData.cpu.usage}%`
        : healthData.cpu?.load
        ? `${healthData.cpu.load}%`
        : 'N/A',
    },
    {
      id: 'uptime',
      label: 'Uptime',
      icon: Clock,
      status: healthData.uptime ? 'ok' : 'unknown',
      value: formatUptime(healthData.uptime || healthData.server?.uptime),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">
            System Health
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Monitor server and infrastructure status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg font-medium text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              healthData.status === 'ok' || healthData.status === 'healthy'
                ? 'bg-green-100 dark:bg-green-900/30'
                : healthData.status === 'warning' ||
                  healthData.status === 'degraded'
                ? 'bg-yellow-100 dark:bg-yellow-900/30'
                : 'bg-neutral-100 dark:bg-neutral-800'
            }`}
          >
            {loading ? (
              <Loader2 size={32} className="animate-spin text-neutral-400" />
            ) : (
              <Activity
                size={32}
                className={getStatusColor(healthData.status || 'unknown')}
              />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-black dark:text-white">
              {loading
                ? 'Checking...'
                : healthData.status === 'ok' || healthData.status === 'healthy'
                ? 'All Systems Operational'
                : healthData.status === 'warning' ||
                  healthData.status === 'degraded'
                ? 'Some Systems Degraded'
                : 'System Status Unknown'}
            </h3>
            <p className="text-neutral-500 mt-1">
              {healthData.message || 'Monitoring server health metrics'}
            </p>
          </div>
        </div>
      </div>

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthMetrics.map(metric => (
          <div
            key={metric.id}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  <metric.icon
                    size={20}
                    className="text-neutral-600 dark:text-neutral-400"
                  />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">{metric.label}</p>
                  <p className="font-medium text-black dark:text-white mt-0.5">
                    {loading ? '...' : metric.value}
                  </p>
                </div>
              </div>
              {!loading && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                    metric.status
                  )}`}
                >
                  {getStatusIcon(metric.status)}
                  <span className="capitalize">
                    {metric.status || 'Unknown'}
                  </span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Server Details */}
      {healthData.server && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Server Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-neutral-500">Node Version</p>
              <p className="font-medium text-black dark:text-white">
                {healthData.server?.nodeVersion ||
                  healthData.nodeVersion ||
                  'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Platform</p>
              <p className="font-medium text-black dark:text-white">
                {healthData.server?.platform || healthData.platform || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Environment</p>
              <p className="font-medium text-black dark:text-white">
                {healthData.server?.environment ||
                  healthData.environment ||
                  process.env.NODE_ENV ||
                  'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Timestamp</p>
              <p className="font-medium text-black dark:text-white">
                {healthData.timestamp
                  ? new Date(healthData.timestamp).toLocaleString()
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
