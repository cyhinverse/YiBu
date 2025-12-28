import { Globe } from 'lucide-react';

const GeneralSettings = ({ settings, onChange }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
        <Globe size={20} />
        Cài đặt chung
      </h2>

      <div className="grid gap-5">
        <div>
          <label className="block text-sm font-medium text-black dark:text-white mb-2">
            Tên trang web
          </label>
          <input
            type="text"
            value={settings.general.siteName}
            onChange={e => onChange('general', 'siteName', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black dark:text-white mb-2">
            Mô tả
          </label>
          <textarea
            rows={3}
            value={settings.general.siteDescription}
            onChange={e =>
              onChange('general', 'siteDescription', e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black dark:text-white mb-2">
            URL trang web
          </label>
          <input
            type="url"
            value={settings.general.siteUrl}
            onChange={e => onChange('general', 'siteUrl', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Email liên hệ
            </label>
            <input
              type="email"
              value={settings.general.contactEmail}
              onChange={e =>
                onChange('general', 'contactEmail', e.target.value)
              }
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Email hỗ trợ
            </label>
            <input
              type="email"
              value={settings.general.supportEmail}
              onChange={e =>
                onChange('general', 'supportEmail', e.target.value)
              }
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
