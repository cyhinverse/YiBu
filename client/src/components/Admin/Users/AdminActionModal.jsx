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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="yb-card bg-surface w-full max-w-md shadow-2xl p-10 overflow-hidden transform animate-scale-in">
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg ${
              actionType === 'unban'
                ? 'bg-success/20 text-success'
                : actionType === 'warn'
                ? 'bg-warning/20 text-warning'
                : 'bg-error/20 text-error'
            }`}
          >
            {actionType === 'unban' ? (
              <Check size={36} strokeWidth={3} />
            ) : actionType === 'warn' ? (
              <AlertTriangle size={36} strokeWidth={3} />
            ) : (
              <Ban size={36} strokeWidth={3} />
            )}
          </div>
          <h3 className="text-2xl font-black text-primary capitalize mb-3 tracking-tight">
            {actionType === 'ban'
              ? 'Chặn tài khoản'
              : actionType === 'unban'
              ? 'Gỡ chặn'
              : actionType === 'warn'
              ? 'Cảnh báo'
              : 'Xóa tài khoản'}
          </h3>
          <p className="text-sm font-bold text-secondary leading-relaxed px-4">
            {actionType === 'ban' &&
              `Bạn có chắc chắn muốn chặn ${targetName}? Quyền truy cập sẽ bị thu hồi ngay lập tức.`}
            {actionType === 'unban' &&
              `Khôi phục quyền truy cập cho ${targetName}?`}
            {actionType === 'warn' &&
              `Gửi cảnh báo chính thức cho ${targetName}?`}
            {actionType === 'delete' &&
              `Xóa vĩnh viễn ${targetName}? Hành động này không thể hoàn tác.`}
          </p>
        </div>

        {['ban', 'suspend', 'warn'].includes(actionType) && (
          <div className="mb-8">
            <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2.5 ml-1">
              {actionType === 'warn' ? 'Nội dung cảnh báo' : 'Lý do thực hiện'}
            </label>
            <textarea
              value={reason}
              onChange={e => onReasonChange(e.target.value)}
              placeholder="Nhập chi tiết tại đây..."
              className="yb-input w-full p-4 h-32 resize-none text-sm font-bold"
            />
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="yb-btn yb-btn-secondary flex-1 py-4 font-black"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`yb-btn flex-1 py-4 font-black flex items-center justify-center gap-2 shadow-xl ${
              actionType === 'unban'
                ? 'bg-success hover:bg-success/90 text-white shadow-success/20'
                : actionType === 'warn'
                ? 'bg-warning hover:bg-warning/90 text-white shadow-warning/20'
                : 'bg-error hover:bg-error/90 text-white shadow-error/20'
            } disabled:opacity-50`}
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
