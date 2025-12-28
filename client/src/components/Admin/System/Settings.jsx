import { useState, useEffect } from 'react';
import {
  Save,
  Globe,
  Bell,
  Shield,
  FileText,
  Users,
  Check,
  Loader2,
} from 'lucide-react';
import {
  useSystemSettings,
  useUpdateSystemSettings,
} from '@/hooks/useAdminQuery';

// Import sub-components
import GeneralSettings from './Settings/GeneralSettings';
import FeaturesSettings from './Settings/FeaturesSettings';
import ContentSettings from './Settings/ContentSettings';
import NotificationSettings from './Settings/NotificationSettings';
import SecuritySettings from './Settings/SecuritySettings';

export default function Settings() {
  const { data: systemSettings, isLoading: loading } = useSystemSettings();
  const { mutate: updateSettings, isLoading: isSavingData } =
    useUpdateSystemSettings();

  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
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
            {activeTab === 'general' && (
              <GeneralSettings settings={settings} onChange={handleChange} />
            )}
            {activeTab === 'features' && (
              <FeaturesSettings settings={settings} onToggle={handleToggle} />
            )}
            {activeTab === 'content' && (
              <ContentSettings
                settings={settings}
                onChange={handleChange}
                onToggle={handleToggle}
              />
            )}
            {activeTab === 'notifications' && (
              <NotificationSettings
                settings={settings}
                onChange={handleChange}
                onToggle={handleToggle}
              />
            )}
            {activeTab === 'security' && (
              <SecuritySettings
                settings={settings}
                onChange={handleChange}
                onToggle={handleToggle}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
