import { Globe } from 'lucide-react';

const GeneralSettings = ({ settings, onChange }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
          <Globe size={24} className="text-neutral-900 dark:text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Cài đặt chung
          </h2>
          <p className="text-sm text-neutral-500 font-medium">
            Thông tin cơ bản về trang web của bạn
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <div>
          <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-2 ml-1">
            Tên trang web
          </label>
          <input
            type="text"
            value={settings.general.siteName}
            onChange={e => onChange('general', 'siteName', e.target.value)}
            className="w-full px-5 py-3 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all font-medium"
            placeholder="Nhập tên trang web..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-2 ml-1">
            Mô tả
          </label>
          <textarea
            rows={4}
            value={settings.general.siteDescription}
            onChange={e =>
              onChange('general', 'siteDescription', e.target.value)
            }
            className="w-full px-5 py-3 rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all font-medium resize-none leading-relaxed"
            placeholder="Nhập mô tả về trang web..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-2 ml-1">
            URL trang web
          </label>
          <input
            type="url"
            value={settings.general.siteUrl}
            onChange={e => onChange('general', 'siteUrl', e.target.value)}
            className="w-full px-5 py-3 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all font-medium"
            placeholder="https://example.com"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-2 ml-1">
              Email liên hệ
            </label>
            <input
              type="email"
              value={settings.general.contactEmail}
              onChange={e =>
                onChange('general', 'contactEmail', e.target.value)
              }
              className="w-full px-5 py-3 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all font-medium"
              placeholder="contact@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-2 ml-1">
              Email hỗ trợ
            </label>
            <input
              type="email"
              value={settings.general.supportEmail}
              onChange={e =>
                onChange('general', 'supportEmail', e.target.value)
              }
              className="w-full px-5 py-3 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all font-medium"
              placeholder="support@example.com"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
