import { Bell } from 'lucide-react';

const NotificationSettings = ({ settings, onChange, onToggle }) => {
  const notificationItems = [
    {
      key: 'emailNotifications',
      label: 'Thông báo email',
      desc: 'Gửi thông báo qua email',
    },
    {
      key: 'pushNotifications',
      label: 'Push notifications',
      desc: 'Gửi thông báo đẩy trên trình duyệt',
    },
    {
      key: 'smsNotifications',
      label: 'Thông báo SMS',
      desc: 'Gửi thông báo qua tin nhắn SMS',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
        <Bell size={20} />
        Cài đặt thông báo
      </h2>

      <div className="space-y-4">
        {notificationItems.map(item => (
          <div
            key={item.key}
            className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl"
          >
            <div>
              <p className="font-medium text-black dark:text-white">
                {item.label}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {item.desc}
              </p>
            </div>
            <button
              onClick={() => onToggle('notifications', item.key)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.notifications[item.key]
                  ? 'bg-black dark:bg-white'
                  : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                  settings.notifications[item.key]
                    ? 'right-1 bg-white dark:bg-black'
                    : 'left-1 bg-white'
                }`}
              />
            </button>
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-black dark:text-white mb-2">
            Tần suất gửi digest
          </label>
          <select
            value={settings.notifications.digestFrequency}
            onChange={e =>
              onChange('notifications', 'digestFrequency', e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            <option value="realtime">Thời gian thực</option>
            <option value="daily">Hàng ngày</option>
            <option value="weekly">Hàng tuần</option>
            <option value="never">Không bao giờ</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
