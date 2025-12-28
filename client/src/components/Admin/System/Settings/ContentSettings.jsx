import { FileText } from 'lucide-react';

const ContentSettings = ({ settings, onChange, onToggle }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
          <FileText size={24} className="text-neutral-900 dark:text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Cài đặt nội dung
          </h2>
          <p className="text-sm text-neutral-500 font-medium">
            Quản lý giới hạn và định dạng nội dung
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <div>
          <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-2 ml-1">
            Độ dài tối đa bài viết (ký tự)
          </label>
          <input
            type="number"
            value={settings.content.maxPostLength}
            onChange={e =>
              onChange('content', 'maxPostLength', parseInt(e.target.value))
            }
            className="w-full px-5 py-3 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all font-medium"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-2 ml-1">
              Kích thước ảnh tối đa (MB)
            </label>
            <input
              type="number"
              value={settings.content.maxImageSize}
              onChange={e =>
                onChange('content', 'maxImageSize', parseInt(e.target.value))
              }
              className="w-full px-5 py-3 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-2 ml-1">
              Kích thước video tối đa (MB)
            </label>
            <input
              type="number"
              value={settings.content.maxVideoSize}
              onChange={e =>
                onChange('content', 'maxVideoSize', parseInt(e.target.value))
              }
              className="w-full px-5 py-3 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-2 ml-1">
            Định dạng ảnh cho phép
          </label>
          <input
            type="text"
            value={settings.content.allowedImageTypes}
            onChange={e =>
              onChange('content', 'allowedImageTypes', e.target.value)
            }
            className="w-full px-5 py-3 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-2 ml-1">
            Định dạng video cho phép
          </label>
          <input
            type="text"
            value={settings.content.allowedVideoTypes}
            onChange={e =>
              onChange('content', 'allowedVideoTypes', e.target.value)
            }
            className="w-full px-5 py-3 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all font-medium"
          />
        </div>

        <div
          className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${
            settings.content.autoModeration
              ? 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700'
              : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 opacity-75'
          }`}
        >
          <div>
            <p className="font-bold text-neutral-900 dark:text-white">
              Kiểm duyệt tự động
            </p>
            <p className="text-sm text-neutral-500 font-medium mt-0.5">
              Tự động kiểm duyệt nội dung bằng AI
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.content.autoModeration}
              onChange={() => onToggle('content', 'autoModeration')}
            />
            <div className="w-12 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-neutral-900 dark:peer-checked:bg-white"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ContentSettings;
