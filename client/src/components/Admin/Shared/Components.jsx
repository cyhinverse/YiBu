import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react";

/**
 * Modal Component
 */
export function Modal({ isOpen, onClose, title, children, size = "md" }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white dark:bg-neutral-900 rounded-2xl w-full ${sizeClasses[size]}`}
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-black dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/**
 * Confirm Modal Component
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = "danger",
}) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: AlertTriangle,
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600",
      confirmBg: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      icon: AlertCircle,
      iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-yellow-600",
      confirmBg: "bg-yellow-600 hover:bg-yellow-700",
    },
    success: {
      icon: CheckCircle,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600",
      confirmBg: "bg-green-600 hover:bg-green-700",
    },
    info: {
      icon: Info,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600",
      confirmBg: "bg-blue-600 hover:bg-blue-700",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-full ${config.iconBg}`}>
            <Icon size={24} className={config.iconColor} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white">
              {title}
            </h2>
          </div>
        </div>

        <p className="text-neutral-600 dark:text-neutral-400 mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white transition-colors ${config.confirmBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Badge Component
 */
export function Badge({ children, variant = "default" }) {
  const variants = {
    default:
      "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    primary: "bg-black text-white dark:bg-white dark:text-black",
    success:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

/**
 * Button Component
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon: Icon,
  onClick,
  className = "",
  ...props
}) {
  const variants = {
    primary:
      "bg-black dark:bg-white text-white dark:text-black hover:opacity-90",
    secondary:
      "border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-green-600 text-white hover:bg-green-700",
    ghost: "hover:bg-neutral-100 dark:hover:bg-neutral-800",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        Icon && <Icon size={size === "sm" ? 16 : size === "lg" ? 20 : 18} />
      )}
      {children}
    </button>
  );
}

/**
 * Input Component
 */
export function Input({ label, error, icon: Icon, className = "", ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-black dark:text-white mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
        )}
        <input
          className={`w-full ${
            Icon ? "pl-10" : "pl-4"
          } pr-4 py-2.5 rounded-xl border ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-neutral-200 dark:border-neutral-700 focus:ring-black dark:focus:ring-white"
          } bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

/**
 * Select Component
 */
export function Select({ label, options, className = "", ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-black dark:text-white mb-2">
          {label}
        </label>
      )}
      <select
        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Toggle Component
 */
export function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        {label && (
          <p className="font-medium text-black dark:text-white">{label}</p>
        )}
        {description && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked
            ? "bg-black dark:bg-white"
            : "bg-neutral-300 dark:bg-neutral-600"
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
            checked ? "right-1 bg-white dark:bg-black" : "left-1 bg-white"
          }`}
        />
      </button>
    </div>
  );
}

/**
 * Avatar Component
 */
export function Avatar({ src, alt, size = "md", fallback }) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <div
      className={`${sizes[size]} rounded-full border-2 border-neutral-200 dark:border-neutral-700 overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center`}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="text-neutral-500 dark:text-neutral-400 font-medium">
          {fallback || alt?.charAt(0)?.toUpperCase()}
        </span>
      )}
    </div>
  );
}

/**
 * Card Component
 */
export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card Header Component
 */
export function CardHeader({ children, className = "" }) {
  return (
    <div
      className={`p-5 border-b border-neutral-200 dark:border-neutral-700 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Card Content Component
 */
export function CardContent({ children, className = "" }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

/**
 * Stat Card Component
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = "neutral",
}) {
  const colors = {
    neutral: {
      iconBg: "bg-neutral-100 dark:bg-neutral-800",
      iconColor: "text-neutral-600 dark:text-neutral-400",
    },
    blue: {
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    green: {
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    red: {
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
    },
    yellow: {
      iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-yellow-600 dark:text-yellow-400",
    },
    purple: {
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  };

  const colorConfig = colors[color];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorConfig.iconBg}`}>
          <Icon size={20} className={colorConfig.iconColor} />
        </div>
        {trend && (
          <span
            className={`text-sm font-medium ${
              trend === "up"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {trend === "up" ? "+" : "-"}
            {trendValue}%
          </span>
        )}
      </div>
      <p className="text-neutral-500 dark:text-neutral-400 text-sm">{title}</p>
      <p className="text-2xl font-bold text-black dark:text-white mt-1">
        {value}
      </p>
    </Card>
  );
}

/**
 * Empty State Component
 */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-full mb-4">
          <Icon size={32} className="text-neutral-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-neutral-500 dark:text-neutral-400 mb-4 max-w-md">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

/**
 * Loading Spinner Component
 */
export function Spinner({ size = "md" }) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
  };

  return (
    <div
      className={`${sizes[size]} border-neutral-300 dark:border-neutral-600 border-t-black dark:border-t-white rounded-full animate-spin`}
    />
  );
}

/**
 * Skeleton Loader Component
 */
export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded ${className}`}
    />
  );
}
