import { Users } from 'lucide-react';

const FeaturesSettings = ({ settings, onToggle }) => {
  const featureItems = [
    {
      key: 'allowRegistration',
      label: 'Cho phép đăng ký',
      desc: 'Người dùng mới có thể tạo tài khoản',
    },
    {
      key: 'emailVerification',
      label: 'Xác thực email',
      desc: 'Yêu cầu xác thực email khi đăng ký',
    },
    {
      key: 'twoFactorAuth',
      label: 'Xác thực 2 yếu tố',
      desc: 'Bật xác thực 2 yếu tố cho tất cả người dùng',
    },
    {
      key: 'publicProfiles',
      label: 'Hồ sơ công khai',
      desc: 'Cho phép hồ sơ người dùng hiển thị công khai',
    },
    {
      key: 'allowComments',
      label: 'Cho phép bình luận',
      desc: 'Người dùng có thể bình luận bài viết',
    },
    {
      key: 'allowSharing',
      label: 'Cho phép chia sẻ',
      desc: 'Người dùng có thể chia sẻ bài viết',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
        <Users size={20} />
        Cài đặt tính năng
      </h2>

      <div className="space-y-4">
        {featureItems.map(item => (
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
              onClick={() => onToggle('features', item.key)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.features[item.key]
                  ? 'bg-black dark:bg-white'
                  : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                  settings.features[item.key]
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

export default FeaturesSettings;
