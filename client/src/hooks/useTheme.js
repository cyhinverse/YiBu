import { useEffect, useRef } from 'react';

/**
 * Apply theme colors from localStorage immediately (before React hydration)
 * This runs once when the module is loaded
 */
const applyInitialTheme = () => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  // Apply colors from localStorage immediately
  const primaryColor = localStorage.getItem('primaryColor');
  const secondaryColor = localStorage.getItem('secondaryColor');
  const textColor = localStorage.getItem('textColor');
  const fontSize = localStorage.getItem('fontSize');
  const theme = localStorage.getItem('theme');

  if (primaryColor) {
    root.style.setProperty('--color-primary', primaryColor);
  }
  if (secondaryColor) {
    root.style.setProperty('--color-secondary', secondaryColor);
  }
  if (textColor) {
    root.style.setProperty('--color-content', textColor);
  }
  if (fontSize) {
    const sizeMap = { small: '14px', medium: '16px', large: '18px' };
    root.style.fontSize = sizeMap[fontSize] || '16px';
  }
  if (theme) {
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(systemDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
  }
};

// Apply immediately when module loads
applyInitialTheme();

export const useTheme = (theme) => {
  const prevThemeRef = useRef({
    appearance: null,
    primaryColor: null,
    secondaryColor: null,
    textColor: null,
    fontSize: null,
  });

  useEffect(() => {
    if (!theme) return;

    const root = document.documentElement;
    const prevTheme = prevThemeRef.current;
    
    const { 
      appearance, 
      fontSize, 
      primaryColor, 
      secondaryColor, 
      textColor 
    } = theme;

    // Apply Appearance
    if (prevTheme.appearance !== appearance && appearance) {
      root.classList.remove("light", "dark");
      if (appearance === "system") {
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.add(systemDark ? "dark" : "light");
      } else {
        root.classList.add(appearance);
      }
      prevTheme.appearance = appearance;
    }

    // Apply Primary Color
    if (prevTheme.primaryColor !== primaryColor) {
      if (primaryColor) {
        root.style.setProperty("--color-primary", primaryColor);
      } else {
        root.style.removeProperty("--color-primary");
      }
      prevTheme.primaryColor = primaryColor;
    }

    // Apply Secondary Color
    if (prevTheme.secondaryColor !== secondaryColor) {
      if (secondaryColor) {
        root.style.setProperty("--color-secondary", secondaryColor);
      } else {
        root.style.removeProperty("--color-secondary");
      }
      prevTheme.secondaryColor = secondaryColor;
    }

    // Apply Text/Content Color
    if (prevTheme.textColor !== textColor) {
      if (textColor) {
        root.style.setProperty("--color-content", textColor);
      } else {
        root.style.removeProperty("--color-content");
      }
      prevTheme.textColor = textColor;
    }

    // Apply Font Size
    if (prevTheme.fontSize !== fontSize && fontSize) {
      const sizeMap = { small: "14px", medium: "16px", large: "18px" };
      root.style.fontSize = sizeMap[fontSize] || "16px";
      prevTheme.fontSize = fontSize;
    }
  }, [theme]);
};
