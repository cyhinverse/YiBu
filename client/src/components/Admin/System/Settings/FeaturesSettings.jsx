import { Users } from 'lucide-react';

const FeaturesSettings = ({ settings, onToggle }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
          <Users size={24} className="text-neutral-900 dark:text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Tính năng
          </h2>
          <p className="text-sm text-neutral-500 font-medium">
            Bật/tắt các tính năng của hệ thống
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {[
          {
            key: 'enableRegistration',
            label: 'Cho phép đăng ký',
            desc: 'Người dùng mới có thể tạo tài khoản',
          },
          {
            key: 'enableComments',
            label: 'Cho phép bình luận',
            desc: 'Người dùng có thể bình luận vào bài viết',
          },
          {
            key: 'enableUploads',
            label: 'Cho phép tải lên',
            desc: 'Người dùng có thể tải lên hình ảnh/video',
          },
          {
            key: 'maintenanceMode',
            label: 'Chế độ bảo trì',
            desc: 'Chỉ admin mới có thể truy cập',
            danger: true,
          },
        ].map(feature => (
          <div
            key={feature.key}
            className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${
              settings.features[feature.key]
                ? 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700'
                : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 opacity-75 grayscale-[0.5]'
            }`}
          >
            <div>
              <p
                className={`font-bold ${
                  feature.danger
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-neutral-900 dark:text-white'
                }`}
              >
                {feature.label}
              </p>
              <p className="text-sm text-neutral-500 font-medium mt-0.5">
                {feature.desc}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.features[feature.key]}
                onChange={() => onToggle('features', feature.key)}
              />
              <div className="w-12 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-neutral-900 dark:peer-checked:bg-white"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturesSettings;
