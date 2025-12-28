import { FileText } from 'lucide-react';

const ContentSettings = ({ settings, onChange, onToggle }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
        <FileText size={20} />
        Cài đặt nội dung
      </h2>

      <div className="grid gap-5">
        <div>
          <label className="block text-sm font-medium text-black dark:text-white mb-2">
            Độ dài tối đa bài viết (ký tự)
          </label>
          <input
            type="number"
            value={settings.content.maxPostLength}
            onChange={e =>
              onChange('content', 'maxPostLength', parseInt(e.target.value))
            }
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Kích thước ảnh tối đa (MB)
            </label>
            <input
              type="number"
              value={settings.content.maxImageSize}
              onChange={e =>
                onChange('content', 'maxImageSize', parseInt(e.target.value))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Kích thước video tối đa (MB)
            </label>
            <input
              type="number"
              value={settings.content.maxVideoSize}
              onChange={e =>
                onChange('content', 'maxVideoSize', parseInt(e.target.value))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-black dark:text-white mb-2">
            Định dạng ảnh cho phép
          </label>
          <input
            type="text"
            value={settings.content.allowedImageTypes}
            onChange={e =>
              onChange('content', 'allowedImageTypes', e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black dark:text-white mb-2">
            Định dạng video cho phép
          </label>
          <input
            type="text"
            value={settings.content.allowedVideoTypes}
            onChange={e =>
              onChange('content', 'allowedVideoTypes', e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
          <div>
            <p className="font-medium text-black dark:text-white">
              Kiểm duyệt tự động
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Tự động kiểm duyệt nội dung bằng AI
            </p>
          </div>
          <button
            onClick={() => onToggle('content', 'autoModeration')}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.content.autoModeration
                ? 'bg-black dark:bg-white'
                : 'bg-neutral-300 dark:bg-neutral-600'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                settings.content.autoModeration
                  ? 'right-1 bg-white dark:bg-black'
                  : 'left-1 bg-white'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentSettings;
