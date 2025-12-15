import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sun, Moon, Monitor, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getSettings,
  updateThemeSettings,
} from '../../../redux/actions/userActions';

const ThemeSettings = () => {
  const dispatch = useDispatch();
  const { settings, loading: settingsLoading } = useSelector(
    state => state.user
  );

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedFontSize = localStorage.getItem('fontSize');
    return {
      appearance: savedTheme || 'system',
      fontSize: savedFontSize || 'medium',
    };
  });
  const [saving, setSaving] = useState(false);

  // Load settings from server
  useEffect(() => {
    dispatch(getSettings());
  }, [dispatch]);

  // Sync local state with server settings
  useEffect(() => {
    if (settings?.theme) {
      setTheme(prev => ({
        appearance: settings.theme.appearance || prev.appearance,
        fontSize: settings.theme.fontSize || prev.fontSize,
      }));
      // Apply the theme from server
      applyTheme(settings.theme.appearance || theme.appearance);
      if (settings.theme.fontSize) {
        applyFontSize(settings.theme.fontSize);
      }
    }
  }, [settings]);

  // Apply theme on mount
  useEffect(() => {
    applyTheme(theme.appearance);
  }, []);

  const applyTheme = appearance => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (appearance === 'system') {
      const systemDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      root.classList.add(systemDark ? 'dark' : 'light');
    } else {
      root.classList.add(appearance);
    }
  };

  const appearances = [
    {
      id: 'light',
      label: 'Light',
      icon: Sun,
      description: 'Light background with dark text',
    },
    {
      id: 'dark',
      label: 'Dark',
      icon: Moon,
      description: 'Dark background with light text',
    },
    {
      id: 'system',
      label: 'System',
      icon: Monitor,
      description: 'Follows your device settings',
    },
  ];

  const fontSizes = [
    { id: 'small', label: 'Small', size: 'text-sm' },
    { id: 'medium', label: 'Medium', size: 'text-base' },
    { id: 'large', label: 'Large', size: 'text-lg' },
  ];

  const applyFontSize = fontSize => {
    const sizeMap = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.fontSize = sizeMap[fontSize] || '16px';
  };

  const handleAppearanceChange = async appearance => {
    const newTheme = { ...theme, appearance };
    setTheme(newTheme);
    localStorage.setItem('theme', appearance);
    applyTheme(appearance);

    // Save to server
    setSaving(true);
    try {
      await dispatch(updateThemeSettings(newTheme)).unwrap();
      toast.success('Đã lưu cài đặt giao diện');
    } catch (error) {
      // Keep local change even if server fails
      console.error('Failed to save theme to server:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFontSizeChange = async fontSize => {
    const newTheme = { ...theme, fontSize };
    setTheme(newTheme);
    localStorage.setItem('fontSize', fontSize);
    applyFontSize(fontSize);

    // Save to server
    setSaving(true);
    try {
      await dispatch(updateThemeSettings(newTheme)).unwrap();
      toast.success('Đã lưu cài đặt giao diện');
    } catch (error) {
      console.error('Failed to save theme to server:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
          Appearance
        </h1>
        <p className="text-neutral-500 text-sm">
          Customize how YiBu looks on your device
        </p>
      </div>

      {/* Theme Selection */}
      <div>
        <h3 className="text-sm font-medium text-black dark:text-white mb-4">
          Theme
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {appearances.map(item => (
            <button
              key={item.id}
              onClick={() => handleAppearanceChange(item.id)}
              disabled={saving}
              className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                theme.appearance === item.id
                  ? 'border-black dark:border-white bg-neutral-50 dark:bg-neutral-800'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  theme.appearance === item.id
                    ? 'bg-black dark:bg-white'
                    : 'bg-neutral-100 dark:bg-neutral-800'
                }`}
              >
                <item.icon
                  size={20}
                  className={
                    theme.appearance === item.id
                      ? 'text-white dark:text-black'
                      : 'text-neutral-500'
                  }
                />
              </div>
              <div className="text-center">
                <p
                  className={`text-sm font-medium ${
                    theme.appearance === item.id
                      ? 'text-black dark:text-white'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {item.description}
                </p>
              </div>
              {theme.appearance === item.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-black dark:bg-white rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white dark:text-black" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <h3 className="text-sm font-medium text-black dark:text-white mb-4">
          Font Size
        </h3>
        <div className="flex gap-3">
          {fontSizes.map(item => (
            <button
              key={item.id}
              onClick={() => handleFontSizeChange(item.id)}
              disabled={saving}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                theme.fontSize === item.id
                  ? 'border-black dark:border-white bg-neutral-50 dark:bg-neutral-800'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              <span
                className={`${item.size} ${
                  theme.fontSize === item.id
                    ? 'text-black dark:text-white font-medium'
                    : 'text-neutral-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
        {saving && (
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-neutral-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang lưu...</span>
          </div>
        )}
      </div>

      {/* Preview */}
      <div>
        <h3 className="text-sm font-medium text-black dark:text-white mb-4">
          Preview
        </h3>
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div>
              <p className="font-medium text-black dark:text-white">John Doe</p>
              <p className="text-xs text-neutral-500">@johndoe · 2h</p>
            </div>
          </div>
          <p className="text-black dark:text-white">
            This is how your posts will look with the current theme settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
