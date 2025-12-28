import { Shield, AlertTriangle } from 'lucide-react';

const SecuritySettings = ({ settings, onChange, onToggle }) => {
  const securityItems = [
    {
      key: 'requireSpecialChar',
      label: 'Yêu cầu ký tự đặc biệt',
      desc: 'Mật khẩu phải chứa ký tự đặc biệt',
    },
    {
      key: 'requireNumber',
      label: 'Yêu cầu số',
      desc: 'Mật khẩu phải chứa ít nhất một số',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
        <Shield size={20} />
        Cài đặt bảo mật
      </h2>

      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-start gap-3">
        <AlertTriangle
          size={20}
          className="text-yellow-600 flex-shrink-0 mt-0.5"
        />
        <div>
          <p className="font-medium text-yellow-800 dark:text-yellow-300">
            Cảnh báo
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Thay đổi cài đặt bảo mật có thể ảnh hưởng đến trải nghiệm người
            dùng.
          </p>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Thời gian hết phiên (phút)
            </label>
            <input
              type="number"
              value={settings.security.sessionTimeout}
              onChange={e =>
                onChange('security', 'sessionTimeout', parseInt(e.target.value))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Số lần đăng nhập sai tối đa
            </label>
            <input
              type="number"
              value={settings.security.maxLoginAttempts}
              onChange={e =>
                onChange(
                  'security',
                  'maxLoginAttempts',
                  parseInt(e.target.value)
                )
              }
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-black dark:text-white mb-2">
            Độ dài mật khẩu tối thiểu
          </label>
          <input
            type="number"
            value={settings.security.passwordMinLength}
            onChange={e =>
              onChange(
                'security',
                'passwordMinLength',
                parseInt(e.target.value)
              )
            }
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        {securityItems.map(item => (
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
              onClick={() => onToggle('security', item.key)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.security[item.key]
                  ? 'bg-black dark:bg-white'
                  : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                  settings.security[item.key]
                    ? 'right-1 bg-white dark:bg-black'
                    : 'left-1 bg-white'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecuritySettings;
