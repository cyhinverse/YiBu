import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sun, Moon, Monitor, Check, Loader2, X } from 'lucide-react';
import {
  getSettings,
  updateThemeSettings,
} from '../../../redux/actions/userActions';

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
  ]
};

const ThemeSettings = () => {
  const dispatch = useDispatch();
  const { settings, loading: settingsLoading } = useSelector(
    state => state.user
  );

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedFontSize = localStorage.getItem('fontSize');
    // Try to get colors from persisted state or defaults
    return {
      appearance: savedTheme || 'system',
      fontSize: savedFontSize || 'medium',
      primaryColor: localStorage.getItem('primaryColor') || '',
      secondaryColor: localStorage.getItem('secondaryColor') || '',
      textColor: localStorage.getItem('textColor') || '',
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
      const newTheme = {
        appearance: settings.theme.appearance || theme.appearance,
        fontSize: settings.theme.fontSize || theme.fontSize,
        primaryColor: settings.theme.primaryColor || theme.primaryColor,
        secondaryColor: settings.theme.secondaryColor || theme.secondaryColor,
        textColor: settings.theme.textColor || theme.textColor,
      };
      setTheme(prev => ({ ...prev, ...newTheme }));
      
      // Update localStorage for consistency
      if (settings.theme.appearance) localStorage.setItem('theme', settings.theme.appearance);
      if (settings.theme.fontSize) localStorage.setItem('fontSize', settings.theme.fontSize);
      if (settings.theme.primaryColor) localStorage.setItem('primaryColor', settings.theme.primaryColor);
      if (settings.theme.secondaryColor) localStorage.setItem('secondaryColor', settings.theme.secondaryColor);
      if (settings.theme.textColor) localStorage.setItem('textColor', settings.theme.textColor);

      // Apply
      applyTheme(newTheme.appearance);
      if (newTheme.fontSize) applyFontSize(newTheme.fontSize);
      applyColors(newTheme);
    }
  }, [settings, theme.appearance, theme.fontSize, theme.primaryColor, theme.secondaryColor, theme.textColor]);

  // Apply theme on mount and change
  useEffect(() => {
    applyTheme(theme.appearance);
    applyColors(theme);
  }, [theme]);

  const applyColors = (currentTheme) => {
    const root = document.documentElement;
    
    // Primary Color
    if (currentTheme.primaryColor) {
      root.style.setProperty('--color-primary', currentTheme.primaryColor);
      // Optional: You could calculate light/dark variants here if needed
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
    setSaving(true);
    try {
      await dispatch(updateThemeSettings({
        ...newTheme, // Send all current theme settings
      })).unwrap();
      
      // Only toast on manual user interactions, not syncs
      // toast.success('Saved'); 
    } catch (error) {
      console.error('Failed to save theme to server:', error);
    } finally {
      setSaving(false);
    }
  };

  const ColorSection = ({ title, type, options, value }) => (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-black dark:text-white mb-3 flex justify-between items-center">
        {title}
        {value && <span className="text-xs font-normal text-neutral-500 uppercase">{value}</span>}
      </h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => handleUpdate(type, option.value)}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
              value === option.value
                ? 'border-black dark:border-white scale-110'
                : 'border-transparent hover:scale-105'
            }`}
            title={option.label}
            style={{ backgroundColor: option.value || 'transparent' }}
          >
            {!option.value && <X className="text-neutral-500" size={14} />}
            {value === option.value && option.value && <Check size={12} className="text-white drop-shadow-md" />}
          </button>
        ))}
        {/* Custom Color Picker */}
        <div className="relative group">
           <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all ${
             // If active value is NOT in presets, mark custom as active
             !options.some(o => o.value === value) && value
               ? 'border-black dark:border-white scale-110'
               : 'border-neutral-200 dark:border-neutral-700'
           }`}>
             <input
               type="color"
               value={value || '#000000'}
               onChange={(e) => handleUpdate(type, e.target.value)}
               className="w-[150%] h-[150%] p-0 m-0 -translate-x-[25%] -translate-y-[25%] cursor-pointer opacity-0 absolute inset-0 z-10"
             />
             <div 
               className="w-full h-full"
               style={{ backgroundColor: value || 'transparent' }} 
             />
             <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-hover:opacity-0 transition-opacity">
               +
             </span>
           </div>
        </div>
      </div>
    </div>
  );

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
          Theme mode
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {appearances.map(item => (
            <button
              key={item.id}
              onClick={() => handleUpdate('appearance', item.id)}
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
              onClick={() => handleUpdate('fontSize', item.id)}
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
      </div>

      <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-6" />
      
      {/* Colors */}
      <div>
         <h2 className="text-lg font-bold text-black dark:text-white mb-4">
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

      {saving && (
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-neutral-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Saving settings...</span>
          </div>
      )}

      {/* Preview */}
      <div>
        <h3 className="text-sm font-medium text-black dark:text-white mb-4">
          Preview
        </h3>
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 border-2" style={{borderColor: 'var(--color-primary, #e5e5e5)'}} />
            <div>
              <p className="font-medium" style={{color: 'var(--color-primary)'}}>Your Name</p>
              <p className="text-xs text-neutral-500">@username · 2h</p>
            </div>
          </div>
          <p style={{ color: 'var(--color-content)' }}>
            This is how your posts will look with the current theme settings. 
            <span style={{color: 'var(--color-primary)', fontWeight: 'bold'}}> Hashtags</span> and <span style={{color: 'var(--color-secondary)'}}>Secondary text</span> will adapt.
          </p>
          <div className="mt-3 flex gap-2">
             <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{backgroundColor: 'var(--color-primary)'}}>
               Primary Button
             </button>
             <button className="px-4 py-2 rounded-lg border text-sm font-medium" style={{borderColor: 'var(--color-secondary)', color: 'var(--color-text-primary)'}}>
               Secondary Button
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
