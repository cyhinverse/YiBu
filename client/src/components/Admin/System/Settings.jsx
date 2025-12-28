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
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  useSystemSettings,
  useUpdateSystemSettings,
} from '@/hooks/useAdminQuery';
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
      <div className="text-center py-20 text-neutral-500 font-medium">
        Không thể tải cài đặt hệ thống.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
            <SettingsIcon
              className="text-neutral-900 dark:text-white"
              size={24}
            />
            Cài đặt hệ thống
          </h1>
          <p className="text-neutral-500 font-medium mt-2">
            Quản lý cấu hình và tùy chỉnh toàn bộ hệ thống
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSavingData}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:shadow-none"
        >
          {isSavingData ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Lưu thay đổi</span>
            </>
          )}
        </button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-3xl animate-in fade-in slide-in-from-top-2">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-full">
            <Check
              size={16}
              className="text-emerald-600 dark:text-emerald-400"
              strokeWidth={3}
            />
          </div>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
            Cài đặt đã được lưu thành công!
          </span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tabs */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-3 sticky top-6 shadow-sm">
            <div className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-left transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-md font-bold transform scale-[1.02]'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium hover:pl-6'
                  }`}
                >
                  <tab.icon
                    size={20}
                    strokeWidth={activeTab === tab.id ? 2.5 : 2}
                  />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
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
