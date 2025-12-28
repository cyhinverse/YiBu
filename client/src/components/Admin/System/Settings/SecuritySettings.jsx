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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
          <Shield size={24} className="text-neutral-900 dark:text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Cài đặt bảo mật
          </h2>
          <p className="text-sm text-neutral-500 font-medium">
            Tăng cường bảo mật cho hệ thống và người dùng
          </p>
        </div>
      </div>

      <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-3xl flex items-start gap-4">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-500 flex-shrink-0">
          <AlertTriangle size={20} strokeWidth={2.5} />
        </div>
        <div>
          <p className="font-bold text-amber-900 dark:text-amber-400">
            Lưu ý quan trọng
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-500/90 mt-1 font-medium">
            Thay đổi cài đặt bảo mật có thể ảnh hưởng đến trải nghiệm đăng nhập
            của người dùng. Hãy cân nhắc kỹ trước khi thay đổi.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-2 ml-1">
              Thời gian hết phiên (phút)
            </label>
            <input
              type="number"
              value={settings.security.sessionTimeout}
              onChange={e =>
                onChange('security', 'sessionTimeout', parseInt(e.target.value))
              }
              className="w-full px-5 py-3 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-2 ml-1">
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
              className="w-full px-5 py-3 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-2 ml-1">
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
            className="w-full px-5 py-3 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all font-medium"
          />
        </div>

        {securityItems.map(item => (
          <div
            key={item.key}
            className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${
              settings.security[item.key]
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
                checked={settings.security[item.key]}
                onChange={() => onToggle('security', item.key)}
              />
              <div className="w-12 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-neutral-900 dark:peer-checked:bg-white"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecuritySettings;
