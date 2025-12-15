import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  Mail,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getSettings,
  updateNotificationSettings,
} from '../../../redux/actions/userActions';

const NotificationSettings = () => {
  const dispatch = useDispatch();
  const { settings, loading } = useSelector(state => state.user);

  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    messages: true,
    email: false,
    push: true,
  });
  const [saving, setSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    dispatch(getSettings());
  }, [dispatch]);

  // Sync local state with Redux state
  useEffect(() => {
    if (settings?.notifications) {
      setNotifications(settings.notifications);
    }
  }, [settings]);

  const handleToggle = async settingKey => {
    const newNotifications = {
      ...notifications,
      [settingKey]: !notifications[settingKey],
    };

    setNotifications(newNotifications);
    setSaving(true);

    try {
      await dispatch(updateNotificationSettings(newNotifications)).unwrap();
      toast.success('Đã lưu cài đặt thông báo');
    } catch (error) {
      // Revert on failure
      setNotifications(notifications);
      toast.error(error || 'Lưu cài đặt thất bại');
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({ enabled, onChange, disabled }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${
        enabled
          ? 'bg-black dark:bg-white'
          : 'bg-neutral-200 dark:bg-neutral-700'
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
          enabled
            ? 'translate-x-5 bg-white dark:bg-black'
            : 'translate-x-0.5 bg-white dark:bg-neutral-400'
        }`}
      />
    </button>
  );

  const NotificationItem = ({ icon: Icon, label, description, settingKey }) => (
    <div className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <Icon size={18} className="text-neutral-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-black dark:text-white">
            {label}
          </p>
          <p className="text-xs text-neutral-500">{description}</p>
        </div>
      </div>
      <ToggleSwitch
        enabled={notifications[settingKey]}
        onChange={() => handleToggle(settingKey)}
        disabled={saving}
      />
    </div>
  );

  if (loading && !settings) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
          Notifications
        </h1>
        <p className="text-neutral-500 text-sm">
          Choose what notifications you want to receive
        </p>
      </div>

      {/* Activity Notifications */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-neutral-500" />
            <h3 className="text-sm font-medium text-black dark:text-white">
              Activity
            </h3>
          </div>
        </div>
        <div className="p-4">
          <NotificationItem
            icon={Heart}
            label="Likes"
            description="When someone likes your post"
            settingKey="likes"
          />
          <NotificationItem
            icon={MessageCircle}
            label="Comments"
            description="When someone comments on your post"
            settingKey="comments"
          />
          <NotificationItem
            icon={UserPlus}
            label="New Followers"
            description="When someone follows you"
            settingKey="follows"
          />
          <NotificationItem
            icon={AtSign}
            label="Mentions"
            description="When someone mentions you"
            settingKey="mentions"
          />
          <NotificationItem
            icon={MessageCircle}
            label="Messages"
            description="When you receive a new message"
            settingKey="messages"
          />
        </div>
      </div>

      {/* Delivery Methods */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-neutral-500" />
            <h3 className="text-sm font-medium text-black dark:text-white">
              Delivery Methods
            </h3>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <p className="text-sm font-medium text-black dark:text-white">
                Push Notifications
              </p>
              <p className="text-xs text-neutral-500">
                Receive notifications on your device
              </p>
            </div>
            <ToggleSwitch
              enabled={notifications.push}
              onChange={() => handleToggle('push')}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-black dark:text-white">
                Email Notifications
              </p>
              <p className="text-xs text-neutral-500">
                Receive notifications via email
              </p>
            </div>
            <ToggleSwitch
              enabled={notifications.email}
              onChange={() => handleToggle('email')}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang lưu...</span>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
