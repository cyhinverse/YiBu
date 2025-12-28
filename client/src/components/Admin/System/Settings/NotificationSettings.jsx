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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
          <Bell size={24} className="text-neutral-900 dark:text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Cài đặt thông báo
          </h2>
          <p className="text-sm text-neutral-500 font-medium">
            Tùy chỉnh cách hệ thống gửi thông báo
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {notificationItems.map(item => (
          <div
            key={item.key}
            className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${
              settings.notifications[item.key]
                ? 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700'
                : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 opacity-75'
            }`}
          >
            <div>
              <p className="font-bold text-neutral-900 dark:text-white">
                {item.label}
              </p>
              <p className="text-sm text-neutral-500 font-medium mt-0.5">
                {item.desc}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.notifications[item.key]}
                onChange={() => onToggle('notifications', item.key)}
              />
              <div className="w-12 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-neutral-900 dark:peer-checked:bg-white"></div>
            </label>
          </div>
        ))}

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-2">
          <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-2 ml-1">
            Tần suất gửi digest
          </label>
          <select
            value={settings.notifications.digestFrequency}
            onChange={e =>
              onChange('notifications', 'digestFrequency', e.target.value)
            }
            className="w-full px-5 py-3 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all font-medium cursor-pointer"
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
