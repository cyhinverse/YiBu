import { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from "react-redux";
import {
  Save,
  Globe,
  Bell,
  Shield,
  FileText,
  Users,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  useSystemSettings,
  useUpdateSystemSettings,
} from '../../../hooks/useAdminQuery';

export default function Settings() {
  // const dispatch = useDispatch();
  // const { systemSettings, loading } = useSelector((state) => state.admin);

  const { data: systemSettings, isLoading: loading } = useSystemSettings();
  const { mutate: updateSettings, isLoading: isSavingData } =
    useUpdateSystemSettings();

  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  // const [isSaving, setIsSaving] = useState(false); // Handled by mutation
  const [showSuccess, setShowSuccess] = useState(false);

  // useEffect(() => {
  //   dispatch(getSystemSettings());
  // }, [dispatch]);

  useEffect(() => {
    // When Query data updates, update local state
    if (systemSettings) {
      setSettings(systemSettings.data || systemSettings);
    }
  }, [systemSettings]);

  const tabs = [
    { id: 'general', label: 'Chung', icon: Globe },
    { id: 'features', label: 'Tính năng', icon: Users },
    { id: 'content', label: 'Nội dung', icon: FileText },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'security', label: 'Bảo mật', icon: Shield },
  ];

  const handleSave = () => {
    if (!settings) return;

    updateSettings(settings, {
      onSuccess: () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      },
    });
  };

  const handleToggle = (category, key) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: !settings[category][key],
      },
    });
  };

  const handleChange = (category, key, value) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    });
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-10 text-neutral-500">
        Không thể tải cài đặt hệ thống.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Cài đặt hệ thống
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Quản lý cấu hình và tùy chỉnh hệ thống
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSavingData}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSavingData ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save size={18} />
              Lưu thay đổi
            </>
          )}
        </button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl animate-fade-in">
          <Check size={20} className="text-green-600" />
          <span className="text-green-700 dark:text-green-400">
            Cài đặt đã được lưu thành công!
          </span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-2 sticky top-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white'
                }`}
              >
                <tab.icon size={18} />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
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
                      onChange={e =>
                        handleChange('general', 'siteName', e.target.value)
                      }
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
                        handleChange(
                          'general',
                          'siteDescription',
                          e.target.value
                        )
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
                      onChange={e =>
                        handleChange('general', 'siteUrl', e.target.value)
                      }
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
                          handleChange(
                            'general',
                            'contactEmail',
                            e.target.value
                          )
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
                          handleChange(
                            'general',
                            'supportEmail',
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features Settings */}
            {activeTab === 'features' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                  <Users size={20} />
                  Cài đặt tính năng
                </h2>

                <div className="space-y-4">
                  {[
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
                  ].map(item => (
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
                        onClick={() => handleToggle('features', item.key)}
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
            )}

            {/* Content Settings */}
            {activeTab === 'content' && (
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
                        handleChange(
                          'content',
                          'maxPostLength',
                          parseInt(e.target.value)
                        )
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
                          handleChange(
                            'content',
                            'maxImageSize',
                            parseInt(e.target.value)
                          )
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
                          handleChange(
                            'content',
                            'maxVideoSize',
                            parseInt(e.target.value)
                          )
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
                        handleChange(
                          'content',
                          'allowedImageTypes',
                          e.target.value
                        )
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
                        handleChange(
                          'content',
                          'allowedVideoTypes',
                          e.target.value
                        )
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
                      onClick={() => handleToggle('content', 'autoModeration')}
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
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                  <Bell size={20} />
                  Cài đặt thông báo
                </h2>

                <div className="space-y-4">
                  {[
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
                  ].map(item => (
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
                        onClick={() => handleToggle('notifications', item.key)}
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
                        handleChange(
                          'notifications',
                          'digestFrequency',
                          e.target.value
                        )
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
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
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
                      Thay đổi cài đặt bảo mật có thể ảnh hưởng đến trải nghiệm
                      người dùng.
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
                          handleChange(
                            'security',
                            'sessionTimeout',
                            parseInt(e.target.value)
                          )
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
                          handleChange(
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
                        handleChange(
                          'security',
                          'passwordMinLength',
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>

                  {[
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
                  ].map(item => (
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
                        onClick={() => handleToggle('security', item.key)}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
