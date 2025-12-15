import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  X,
} from 'lucide-react';
import { broadcastNotification } from '../../../redux/actions/adminActions';

const NOTIFICATION_TYPES = [
  { id: 'info', label: 'Information', icon: Info, color: 'blue' },
  { id: 'success', label: 'Success', icon: CheckCircle2, color: 'green' },
  { id: 'warning', label: 'Warning', icon: AlertTriangle, color: 'yellow' },
  { id: 'alert', label: 'Alert', icon: AlertCircle, color: 'red' },
  {
    id: 'announcement',
    label: 'Announcement',
    icon: Sparkles,
    color: 'purple',
  },
];

const TARGET_AUDIENCES = [
  { id: 'all', label: 'All Users', description: 'Send to everyone' },
  {
    id: 'active',
    label: 'Active Users',
    description: 'Users active in last 30 days',
  },
  {
    id: 'new',
    label: 'New Users',
    description: 'Users registered in last 7 days',
  },
  {
    id: 'verified',
    label: 'Verified Users',
    description: 'Only verified accounts',
  },
];

const Broadcast = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.admin);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    targetAudience: 'all',
    priority: 'normal',
    link: '',
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // 'success' | 'error' | null
  const [statusMessage, setStatusMessage] = useState('');

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
      setSendStatus('error');
      setStatusMessage('Please fill in both title and message');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSend = async () => {
    try {
      await dispatch(
        broadcastNotification({
          title: formData.title,
          message: formData.message,
          type: formData.type,
          targetAudience: formData.targetAudience,
          priority: formData.priority,
          link: formData.link || undefined,
        })
      ).unwrap();

      setSendStatus('success');
      setStatusMessage('Notification sent successfully!');
      setFormData({
        title: '',
        message: '',
        type: 'info',
        targetAudience: 'all',
        priority: 'normal',
        link: '',
      });
    } catch (error) {
      setSendStatus('error');
      setStatusMessage(error?.message || 'Failed to send notification');
    }
    setShowConfirmModal(false);

    // Clear status after 5 seconds
    setTimeout(() => {
      setSendStatus(null);
      setStatusMessage('');
    }, 5000);
  };

  const getTypeColor = (type, variant = 'bg') => {
    const colors = {
      info: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500',
      },
      success: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-500',
      },
      warning: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-600 dark:text-yellow-400',
        border: 'border-yellow-500',
      },
      alert: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-500',
      },
      announcement: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500',
      },
    };
    return colors[type]?.[variant] || colors.info[variant];
  };

  const selectedType = NOTIFICATION_TYPES.find(t => t.id === formData.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-black dark:text-white">
          Broadcast Notification
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Send notifications to all or specific groups of users
        </p>
      </div>

      {/* Status Message */}
      {sendStatus && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            sendStatus === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}
        >
          {sendStatus === 'success' ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{statusMessage}</span>
          <button
            onClick={() => setSendStatus(null)}
            className="ml-auto hover:opacity-70"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Notification Type */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Notification Type
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {NOTIFICATION_TYPES.map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleTypeSelect(type.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  formData.type === type.id
                    ? `${getTypeColor(type.id, 'bg')} ${getTypeColor(
                        type.id,
                        'border'
                      )}`
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
              >
                <type.icon
                  size={24}
                  className={
                    formData.type === type.id
                      ? getTypeColor(type.id, 'text')
                      : 'text-neutral-400'
                  }
                />
                <span
                  className={`text-sm font-medium ${
                    formData.type === type.id
                      ? getTypeColor(type.id, 'text')
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Notification Content
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter notification title"
                maxLength={100}
                className="w-full px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
              />
              <p className="text-xs text-neutral-500 mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Enter notification message"
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 resize-none"
              />
              <p className="text-xs text-neutral-500 mt-1">
                {formData.message.length}/500 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Link (Optional)
              </label>
              <input
                type="url"
                name="link"
                value={formData.link}
                onChange={handleInputChange}
                placeholder="https://example.com/page"
                className="w-full px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
              />
            </div>
          </div>
        </div>

        {/* Target Audience */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Target Audience
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TARGET_AUDIENCES.map(audience => (
              <button
                key={audience.id}
                type="button"
                onClick={() => handleAudienceSelect(audience.id)}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                  formData.targetAudience === audience.id
                    ? 'border-black dark:border-white bg-neutral-100 dark:bg-neutral-800'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
              >
                <Users
                  size={20}
                  className={
                    formData.targetAudience === audience.id
                      ? 'text-black dark:text-white'
                      : 'text-neutral-400'
                  }
                />
                <div>
                  <span
                    className={`font-medium ${
                      formData.targetAudience === audience.id
                        ? 'text-black dark:text-white'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {audience.label}
                  </span>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {audience.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Priority
          </h3>
          <div className="flex gap-3">
            {['low', 'normal', 'high', 'urgent'].map(priority => (
              <button
                key={priority}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, priority }))}
                className={`px-4 py-2 rounded-lg border-2 font-medium text-sm capitalize transition-all ${
                  formData.priority === priority
                    ? priority === 'urgent'
                      ? 'border-red-500 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      : priority === 'high'
                      ? 'border-orange-500 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                      : 'border-black dark:border-white bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300'
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Preview
          </h3>
          <div
            className={`p-4 rounded-lg border ${getTypeColor(
              formData.type,
              'bg'
            )} ${getTypeColor(formData.type, 'border').replace(
              'border-',
              'border-l-4 border-'
            )}`}
          >
            <div className="flex items-start gap-3">
              {selectedType && (
                <selectedType.icon
                  size={20}
                  className={getTypeColor(formData.type, 'text')}
                />
              )}
              <div className="flex-1">
                <h4
                  className={`font-semibold ${getTypeColor(
                    formData.type,
                    'text'
                  )}`}
                >
                  {formData.title || 'Notification Title'}
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  {formData.message ||
                    'Notification message will appear here...'}
                </p>
                {formData.link && (
                  <a
                    href={formData.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline mt-2 inline-block"
                  >
                    {formData.link}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              loading || !formData.title.trim() || !formData.message.trim()
            }
            className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            Send Notification
          </button>
        </div>
      </form>

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
                  Confirm Broadcast
                </h3>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                You are about to send a notification to{' '}
                <span className="font-medium text-black dark:text-white">
                  {TARGET_AUDIENCES.find(a => a.id === formData.targetAudience)
                    ?.label || 'all users'}
                </span>
                . This action cannot be undone.
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
                  Cancel
                </button>
                <button
                  onClick={confirmSend}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Confirm Send
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
