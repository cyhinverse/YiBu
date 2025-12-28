import { useState } from 'react';
import {
  Send,
  Bell,
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  AlertTriangle,
  Sparkles,
  Megaphone,
} from 'lucide-react';
import { useBroadcastNotification } from '@/hooks/useAdminQuery';

const NOTIFICATION_TYPES = [
  {
    id: 'info',
    label: 'Thông tin',
    icon: Info,
    color: 'blue',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'success',
    label: 'Thành công',
    icon: CheckCircle2,
    color: 'green',
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'warning',
    label: 'Cảnh báo',
    icon: AlertTriangle,
    color: 'yellow',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    id: 'alert',
    label: 'Khẩn cấp',
    icon: AlertCircle,
    color: 'red',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'announcement',
    label: 'Thông báo',
    icon: Sparkles,
    color: 'purple',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
  },
];

const TARGET_AUDIENCES = [
  {
    id: 'all',
    label: 'Tất cả người dùng',
    description: 'Gửi cho toàn bộ người dùng',
  },
  {
    id: 'active',
    label: 'Người dùng hoạt động',
    description: 'Hoạt động trong 30 ngày qua',
  },
  {
    id: 'new',
    label: 'Người dùng mới',
    description: 'Đăng ký trong 7 ngày qua',
  },
  {
    id: 'verified',
    label: 'Đã xác thực',
    description: 'Chỉ tài khoản đã xác minh',
  },
];

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
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
            <Megaphone className="text-neutral-900 dark:text-white" size={24} />
            Phát sóng thông báo
          </h2>
          <p className="text-neutral-500 font-medium mt-2">
            Gửi thông báo đến người dùng hệ thống
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8">
            {/* Notification Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-neutral-900 dark:text-white ml-1">
                Loại thông báo
              </label>
              <div className="flex flex-wrap gap-2">
                {NOTIFICATION_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all duration-200 ${
                      formData.type === type.id
                        ? `${type.bg} ${type.text} border-${type.color}-200 dark:border-${type.color}-800 ring-1 ring-${type.color}-500 dark:ring-${type.color}-400`
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 text-neutral-500'
                    }`}
                  >
                    <type.icon
                      size={16}
                      className={
                        formData.type === type.id
                          ? 'current-color'
                          : 'text-neutral-400'
                      }
                      strokeWidth={2.5}
                    />
                    <span className="text-sm font-bold">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-neutral-900 dark:text-white ml-1">
                Đối tượng nhận
              </label>
              <div className="relative">
                <Users
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
                />
                <select
                  value={formData.targetAudience}
                  onChange={e => handleAudienceSelect(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 appearance-none rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                >
                  {TARGET_AUDIENCES.map(audience => (
                    <option key={audience.id} value={audience.id}>
                      {audience.label} - {audience.description}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
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
                <label className="text-sm font-bold text-neutral-900 dark:text-white ml-1">
                  Tiêu đề thông báo
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Nhập tiêu đề..."
                  className="w-full px-4 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-900 dark:text-white ml-1">
                  Nội dung chi tiết
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Nhập nội dung thông báo..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-3xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all font-medium resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-900 dark:text-white ml-1">
                  Đường dẫn đính kèm (Tùy chọn)
                </label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  placeholder="https://example.com/..."
                  className="w-full px-4 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all font-medium text-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm sticky top-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              Xem trước
            </h3>

            <div
              className={`p-4 rounded-2xl border transition-all ${selectedType?.bg} border-${selectedType?.color}-200 dark:border-${selectedType?.color}-800`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl bg-white dark:bg-neutral-900 shadow-sm ${selectedType?.text}`}
                >
                  {selectedType && <selectedType.icon size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-bold text-base mb-1 ${selectedType?.text}`}
                  >
                    {formData.title || 'Tiêu đề thông báo'}
                  </h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-2">
                    {formData.message ||
                      'Nội dung thông báo sẽ hiển thị ở đây...'}
                  </p>
                  <span className="text-xs font-medium text-neutral-400 flex items-center gap-1">
                    <Users size={12} />
                    Gửi đến:{' '}
                    {
                      TARGET_AUDIENCES.find(
                        a => a.id === formData.targetAudience
                      )?.label
                    }
                  </span>
                  {formData.link && (
                    <div className="mt-3 pt-3 border-t border-neutral-200/50 dark:border-neutral-700/50">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full block w-fit truncate max-w-full">
                        🔗 {formData.link}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={
                  loading || !formData.title.trim() || !formData.message.trim()
                }
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md mx-4 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <Bell
                    size={24}
                    className="text-yellow-600 dark:text-yellow-400"
                  />
                </div>
                <h3 className="text-lg font-bold text-black dark:text-white">
                  Xác nhận gửi thông báo
                </h3>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                Bạn sắp gửi thông báo đến{' '}
                <span className="font-medium text-black dark:text-white">
                  {TARGET_AUDIENCES.find(a => a.id === formData.targetAudience)
                    ?.label || 'tất cả người dùng'}
                </span>
                . Hành động này không thể hoàn tác.
              </p>
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 mb-6">
                <p className="font-medium text-black dark:text-white">
                  {formData.title}
                </p>
                <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                  {formData.message}
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmSend}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50"
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
