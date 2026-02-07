import { useEffect, useState } from 'react';
import { Send, Bell, Users, Loader2, Megaphone, Sparkles } from 'lucide-react';
import { useBroadcastNotification } from '@/hooks/useAdminQuery';
import { NOTIFICATION_TYPES, TARGET_AUDIENCES } from '@/constants/broadcast';

const Broadcast = () => {
  const broadcastMutation = useBroadcastNotification();
  const loading = broadcastMutation.isLoading;

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    targetAudience: 'all',
    priority: 'normal',
    link: '',
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeSelect = typeId => {
    setFormData(prev => ({ ...prev, type: typeId }));
  };

  const handleAudienceSelect = audienceId => {
    setFormData(prev => ({ ...prev, targetAudience: audienceId }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      // Show toast error here if implemented, otherwise just return
      return;
    }
    setShowConfirmModal(true);
  };

  useEffect(() => {
    if (!showConfirmModal) return undefined;
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        setShowConfirmModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfirmModal]);

  const confirmSend = async () => {
    try {
      await broadcastMutation.mutateAsync({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        targetAudience: formData.targetAudience,
        priority: formData.priority,
        link: formData.link || undefined,
      });

      setFormData({
        title: '',
        message: '',
        type: 'info',
        targetAudience: 'all',
        priority: 'normal',
        link: '',
      });
    } catch (error) {
      console.error('Broadcast error:', error);
    } finally {
      setShowConfirmModal(false);
    }
  };

  const selectedType = NOTIFICATION_TYPES.find(t => t.id === formData.type);

  return (
    <div className="admin-page pb-10">
      {/* Header */}
      <div className="admin-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Thông báo
          </p>
          <h2 className="text-2xl font-semibold text-[var(--color-content)] flex items-center gap-3">
            <Megaphone className="text-[var(--color-content)]" size={22} />
            Phát sóng thông báo
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            Gửi thông báo đến người dùng hệ thống
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="admin-card p-4 space-y-6">
            {/* Notification Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-[var(--color-content)] ml-1">
                Loại thông báo
              </label>
              <div className="flex flex-wrap gap-2">
                {NOTIFICATION_TYPES.map(type => (
                  <button
                    type="button"
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-colors duration-200 ${
                      formData.type === type.id
                        ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                        : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    <type.icon
                      size={16}
                      className={
                        formData.type === type.id
                          ? 'current-color'
                          : 'text-[var(--color-text-tertiary)]'
                      }
                      strokeWidth={2.5}
                    />
                    <span className="text-sm font-semibold">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-[var(--color-content)] ml-1">
                Đối tượng nhận
              </label>
              <div className="relative">
                <Users
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
                />
                <select
                  value={formData.targetAudience}
                  onChange={e => handleAudienceSelect(e.target.value)}
                  className="admin-select w-full pl-11 pr-10 appearance-none cursor-pointer"
                >
                  {TARGET_AUDIENCES.map(audience => (
                    <option key={audience.id} value={audience.id}>
                      {audience.label} - {audience.description}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)]">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.5 4.5L6 8L9.5 4.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="broadcast-title"
                  className="text-sm font-semibold text-[var(--color-content)] ml-1"
                >
                  Tiêu đề thông báo
                </label>
                <input
                  id="broadcast-title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Nhập tiêu đề..."
                  aria-label="Notification title"
                  className="admin-input w-full"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="broadcast-message"
                  className="text-sm font-semibold text-[var(--color-content)] ml-1"
                >
                  Nội dung chi tiết
                </label>
                <textarea
                  id="broadcast-message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Nhập nội dung thông báo..."
                  rows={4}
                  aria-label="Notification message"
                  className="admin-textarea w-full min-h-[140px]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="broadcast-link"
                  className="text-sm font-semibold text-[var(--color-content)] ml-1"
                >
                  Đường dẫn đính kèm (Tùy chọn)
                </label>
                <input
                  id="broadcast-link"
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  placeholder="https://example.com/..."
                  aria-label="Notification link"
                  className="admin-input w-full text-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="space-y-5">
          <div className="admin-card p-4 sticky top-4">
            <h3 className="text-base font-semibold text-[var(--color-content)] mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              Xem trước
            </h3>

            <div className={`p-4 rounded-2xl transition-colors ${selectedType?.bg}`}>
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl bg-[var(--color-surface)] ${selectedType?.text}`}
                >
                  {selectedType && <selectedType.icon size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-semibold text-base mb-1 ${selectedType?.text}`}
                  >
                    {formData.title || 'Tiêu đề thông báo'}
                  </h4>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-2">
                    {formData.message ||
                      'Nội dung thông báo sẽ hiển thị ở đây...'}
                  </p>
                  <span className="text-xs font-medium text-[var(--color-text-tertiary)] flex items-center gap-1">
                    <Users size={12} />
                    Gửi đến:{' '}
                    {
                      TARGET_AUDIENCES.find(
                        a => a.id === formData.targetAudience
                      )?.label
                    }
                  </span>
                  {formData.link && (
                    <div className="mt-3 pt-3">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full block w-fit truncate max-w-full">
                        🔗 {formData.link}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  loading || !formData.title.trim() || !formData.message.trim()
                }
                onKeyDown={event => {
                  if (event.key === 'Escape') {
                    event.currentTarget.blur();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
                Gửi thông báo ngay
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              setShowConfirmModal(false);
            }
          }}
        >
          <div className="admin-card rounded-2xl w-full max-w-md mx-4">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <Bell
                    size={24}
                    className="text-yellow-600 dark:text-yellow-400"
                  />
                </div>
                <h3 className="text-base font-semibold text-[var(--color-content)]">
                  Xác nhận gửi thông báo
                </h3>
              </div>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Bạn sắp gửi thông báo đến{' '}
                <span className="font-medium text-[var(--color-content)]">
                  {TARGET_AUDIENCES.find(a => a.id === formData.targetAudience)
                    ?.label || 'tất cả người dùng'}
                </span>
                . Hành động này không thể hoàn tác.
              </p>
              <div className="bg-[var(--color-surface-secondary)] rounded-lg p-4 mb-6">
                <p className="font-medium text-[var(--color-content)]">
                  {formData.title}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                  {formData.message}
                </p>
              </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 rounded-lg bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={confirmSend}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90 disabled:opacity-50"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    Tiến hành gửi
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Broadcast;
