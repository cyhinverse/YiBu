import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Monitor, Check, Loader2, X } from 'lucide-react';
import { useSettings, useUpdateSettings } from '@/hooks/useUserQuery';

const PRESETS = {
  primary: [
    { label: 'Default', value: '' }, // Reset to default
    { label: 'Emerald', value: '#10b981' },
    { label: 'Blue', value: '#3b82f6' },
    { label: 'Violet', value: '#8b5cf6' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Amber', value: '#f59e0b' },
  ],
  secondary: [
    { label: 'Default', value: '' },
    { label: 'Slate', value: '#64748b' },
    { label: 'Gray', value: '#6b7280' },
    { label: 'Zinc', value: '#71717a' },
    { label: 'Neutral', value: '#737373' },
    { label: 'Stone', value: '#78716c' },
  ],
  text: [
    { label: 'Default', value: '' },
    { label: 'Pure Black', value: '#000000' },
    { label: 'Dark Gray', value: '#1f2937' },
    { label: 'Navy', value: '#1e3a8a' },
    { label: 'Dark Slate', value: '#334155' },
  ],
};

const ThemeSettings = () => {
  const { data: settingsData, isLoading: settingsLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [theme, setTheme] = useState({
    appearance: localStorage.getItem('theme') || 'system',
    fontSize: localStorage.getItem('fontSize') || 'medium',
    primaryColor: localStorage.getItem('primaryColor') || '',
    secondaryColor: localStorage.getItem('secondaryColor') || '',
    textColor: localStorage.getItem('textColor') || '',
  });

  // Sync local state with server settings
  useEffect(() => {
    if (settingsData?.theme) {
      const newTheme = {
        appearance: settingsData.theme.appearance || theme.appearance,
        fontSize: settingsData.theme.fontSize || theme.fontSize,
        primaryColor: settingsData.theme.primaryColor || theme.primaryColor,
        secondaryColor:
          settingsData.theme.secondaryColor || theme.secondaryColor,
        textColor: settingsData.theme.textColor || theme.textColor,
      };
      setTheme(newTheme);

      // Update localStorage for consistency
      if (settingsData.theme.appearance)
        localStorage.setItem('theme', settingsData.theme.appearance);
      if (settingsData.theme.fontSize)
        localStorage.setItem('fontSize', settingsData.theme.fontSize);
      if (settingsData.theme.primaryColor)
        localStorage.setItem('primaryColor', settingsData.theme.primaryColor);
      if (settingsData.theme.secondaryColor)
        localStorage.setItem(
          'secondaryColor',
          settingsData.theme.secondaryColor
        );
      if (settingsData.theme.textColor)
        localStorage.setItem('textColor', settingsData.theme.textColor);

      // Apply
      applyTheme(newTheme.appearance);
      if (newTheme.fontSize) applyFontSize(newTheme.fontSize);
      applyColors(newTheme);
    }
  }, [settingsData]);

  // Apply theme on change
  useEffect(() => {
    applyTheme(theme.appearance);
    applyColors(theme);
    applyFontSize(theme.fontSize);
  }, [theme]);

  const applyColors = currentTheme => {
    const root = document.documentElement;

    // Primary Color
    if (currentTheme.primaryColor) {
      root.style.setProperty('--color-primary', currentTheme.primaryColor);
    } else {
      root.style.removeProperty('--color-primary');
    }

    // Secondary Color
    if (currentTheme.secondaryColor) {
      root.style.setProperty('--color-secondary', currentTheme.secondaryColor);
    } else {
      root.style.removeProperty('--color-secondary');
    }

    // Text Color
    if (currentTheme.textColor) {
      root.style.setProperty('--color-content', currentTheme.textColor);
    } else {
      root.style.removeProperty('--color-content');
    }
  };

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

  const handleUpdate = async (key, value) => {
    const newTheme = { ...theme, [key]: value };
    setTheme(newTheme);

    // Update local storage
    if (key === 'appearance') localStorage.setItem('theme', value);
    if (key === 'fontSize') localStorage.setItem('fontSize', value);
    if (['primaryColor', 'secondaryColor', 'textColor'].includes(key)) {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    }

    if (key === 'appearance') applyTheme(value);
    if (key === 'fontSize') applyFontSize(value);

    // Save to server
    try {
      await updateSettingsMutation.mutateAsync({
        type: 'theme',
        settings: newTheme,
      });
    } catch (error) {
      console.error('Failed to save theme to server:', error);
    }
  };

  const ColorSection = ({ title, type, options, value }) => {
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [tempColor, setTempColor] = useState(value || '#000000');
    const pickerRef = useRef(null);

    const isCustomColor = value && !options.some(o => o.value === value);

    // Close picker when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (pickerRef.current && !pickerRef.current.contains(event.target)) {
          setShowCustomPicker(false);
        }
      };

      if (showCustomPicker) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showCustomPicker]);

    const handleApplyColor = () => {
      handleUpdate(type, tempColor);
      setShowCustomPicker(false);
    };

    const handleOpenPicker = () => {
      setTempColor(value || '#000000');
      setShowCustomPicker(true);
    };

    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-content dark:text-white mb-3 flex justify-between items-center">
          {title}
          {value && (
            <span className="text-xs font-normal text-neutral-500 uppercase">
              {value}
            </span>
          )}
        </h3>
        <div className="flex flex-wrap gap-2">
          {options.map(option => (
            <button
              key={option.label}
              onClick={() => handleUpdate(type, option.value)}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                value === option.value
                  ? 'border-primary scale-110'
                  : 'border-transparent hover:scale-105'
              }`}
              title={option.label}
              style={{ backgroundColor: option.value || 'transparent' }}
            >
              {!option.value && <X className="text-neutral-500" size={14} />}
              {value === option.value && option.value && (
                <Check size={12} className="text-white drop-shadow-md" />
              )}
            </button>
          ))}
          {/* Custom Color Picker */}
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={handleOpenPicker}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                isCustomColor
                  ? 'border-primary scale-110'
                  : 'border-neutral-200 dark:border-neutral-700 hover:scale-105'
              }`}
              style={{ backgroundColor: isCustomColor ? value : '#e5e5e5' }}
            >
              {!isCustomColor && (
                <span className="text-xs font-medium text-neutral-500">+</span>
              )}
              {isCustomColor && (
                <Check size={12} className="text-white drop-shadow-md" />
              )}
            </button>

            {/* Custom Color Picker Popup */}
            {showCustomPicker && (
              <div 
                className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col gap-3">
                  <input
                    type="color"
                    value={tempColor}
                    onChange={(e) => setTempColor(e.target.value)}
                    className="w-32 h-32 cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempColor}
                      onChange={(e) => setTempColor(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-600 rounded bg-transparent text-content dark:text-white"
                      placeholder="#000000"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomPicker(false)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyColor}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-content dark:text-white mb-2">
          Appearance
        </h1>
        <p className="text-neutral-500 text-sm">
          Customize how YiBu looks on your device
        </p>
      </div>

      {/* Theme Selection */}
      <div>
        <h3 className="text-sm font-medium text-content dark:text-white mb-4">
          Theme mode
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {appearances.map(item => (
            <button
              key={item.id}
              onClick={() => handleUpdate('appearance', item.id)}
              disabled={updateSettingsMutation.isPending}
              className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                updateSettingsMutation.isPending
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              } ${
                theme.appearance === item.id
                  ? 'border-primary bg-neutral-50 dark:bg-neutral-800'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  theme.appearance === item.id
                    ? 'bg-primary'
                    : 'bg-neutral-100 dark:bg-neutral-800'
                }`}
              >
                <item.icon
                  size={20}
                  className={
                    theme.appearance === item.id
                      ? 'text-primary-foreground'
                      : 'text-neutral-500'
                  }
                />
              </div>
              <div className="text-center">
                <p
                  className={`text-sm font-medium ${
                    theme.appearance === item.id
                      ? 'text-content dark:text-white'
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
                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check size={12} className="text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <h3 className="text-sm font-medium text-content dark:text-white mb-4">
          Font Size
        </h3>
        <div className="flex gap-3">
          {fontSizes.map(item => (
            <button
              key={item.id}
              onClick={() => handleUpdate('fontSize', item.id)}
              disabled={updateSettingsMutation.isPending}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                updateSettingsMutation.isPending
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              } ${
                theme.fontSize === item.id
                  ? 'border-primary bg-neutral-50 dark:bg-neutral-800'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              <span
                className={`${item.size} ${
                  theme.fontSize === item.id
                    ? 'text-content dark:text-white font-medium'
                    : 'text-neutral-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-6" />

      {/* Colors */}
      <div>
        <h2 className="text-lg font-bold text-content dark:text-white mb-4">
          Color Customization
        </h2>

        <ColorSection
          title="Primary Color"
          type="primaryColor"
          options={PRESETS.primary}
          value={theme.primaryColor}
        />

        <ColorSection
          title="Secondary Color"
          type="secondaryColor"
          options={PRESETS.secondary}
          value={theme.secondaryColor}
        />

        <ColorSection
          title="Text Color"
          type="textColor"
          options={PRESETS.text}
          value={theme.textColor}
        />
      </div>

      {updateSettingsMutation.isPending && (
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving settings...</span>
        </div>
      )}

      {/* Preview */}
      <div>
        <h3 className="text-sm font-medium text-content dark:text-white mb-4">
          Preview
        </h3>
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 border-2"
              style={{ borderColor: 'var(--color-primary, #e5e5e5)' }}
            />
            <div>
              <p
                className="font-medium"
                style={{ color: 'var(--color-primary)' }}
              >
                Your Name
              </p>
              <p className="text-xs text-neutral-500">@username · 2h</p>
            </div>
          </div>
          <p style={{ color: 'var(--color-content)' }}>
            This is how your posts will look with the current theme settings.
            <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
              {' '}
              Hashtags
            </span>{' '}
            and{' '}
            <span style={{ color: 'var(--color-secondary)' }}>
              Secondary text
            </span>{' '}
            will adapt.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Primary Button
            </button>
            <button
              className="px-4 py-2 rounded-lg border text-sm font-medium"
              style={{
                borderColor: 'var(--color-secondary)',
                color: 'var(--color-text-primary)',
              }}
            >
              Secondary Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
