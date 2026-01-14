import { Check, AlertTriangle, Ban, Loader2 } from 'lucide-react';

const AdminActionModal = ({
  isOpen,
  actionType,
  targetName,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
  loading,
}) => {
  if (!isOpen) return null;

  const getConfig = () => {
    switch (actionType) {
      case 'ban':
      case 'delete': // Assuming delete shares red styling
        return {
          icon: actionType === 'delete' ? Ban : Ban, // Or specific icon for delete if available
          bg: 'bg-rose-50 dark:bg-rose-900/20',
          text: 'text-rose-600 dark:text-rose-400',
          btn: 'bg-rose-600 hover:bg-rose-700 text-white',
          title: actionType === 'ban' ? 'Chặn tài khoản' : 'Xóa tài khoản',
        };
      case 'unban':
        return {
          icon: Check,
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          text: 'text-emerald-600 dark:text-emerald-400',
          btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          title: 'Gỡ chặn',
        };
      case 'warn':
        return {
          icon: AlertTriangle,
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          text: 'text-amber-600 dark:text-amber-400',
          btn: 'bg-amber-500 hover:bg-amber-600 text-white',
          title: 'Cảnh báo',
        };
      case 'suspend':
        return {
          icon: AlertTriangle,
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          text: 'text-orange-600 dark:text-orange-400',
          btn: 'bg-orange-500 hover:bg-orange-600 text-white',
          title: 'Tạm ngưng',
        };
      default:
        return {
          icon: AlertTriangle,
          bg: 'bg-neutral-50',
          text: 'text-neutral-600',
          btn: 'bg-neutral-900 text-white',
          title: 'Xác nhận',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md shadow-2xl rounded-3xl p-8 transform animate-in scale-95 duration-200 overflow-hidden">
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${config.bg} ${config.text}`}
          >
            <Icon size={32} strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white capitalize mb-2 tracking-tight">
            {config.title}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed px-4">
            {actionType === 'ban' &&
              `Bạn có chắc chắn muốn chặn ${targetName}? Quyền truy cập sẽ bị thu hồi ngay lập tức.`}
            {actionType === 'unban' &&
              `Khôi phục quyền truy cập cho ${targetName}?`}
            {actionType === 'warn' &&
              `Gửi cảnh báo chính thức cho ${targetName}?`}
            {actionType === 'delete' &&
              `Xóa vĩnh viễn ${targetName}? Hành động này không thể hoàn tác.`}
            {actionType === 'suspend' &&
              `Tạm ngưng tài khoản ${targetName} trong 7 ngày?`}
          </p>
        </div>
        {['ban', 'suspend', 'warn'].includes(actionType) && (
          <div className="mb-8">
            <label className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wide block mb-2.5 ml-1">
              {actionType === 'warn' ? 'Nội dung cảnh báo' : 'Lý do thực hiện'}
            </label>
            <textarea
              value={reason}
              onChange={e => onReasonChange(e.target.value)}
              placeholder="Nhập chi tiết tại đây..."
              className="w-full p-4 h-32 resize-none text-sm font-medium bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl focus:ring-2 focus:ring-primary/50 transition-all outline-none"
            />
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${config.btn}`}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminActionModal;
