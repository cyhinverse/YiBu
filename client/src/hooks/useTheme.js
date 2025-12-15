import { useEffect, useRef } from 'react';

export const useTheme = (theme) => {
  const prevThemeRef = useRef({
    appearance: null,
    primaryColor: null,
    fontSize: null,
  });

  useEffect(() => {
    if (!theme) return;

    const root = document.documentElement;
    const prevTheme = prevThemeRef.current;
    
    // Destructure with default fallbacks to prevent "undefined" writes
    const { 
      appearance, 
      fontSize, 
      primaryColor, 
      secondaryColor, 
      textColor 
    } = theme;

    // Apply Appearance
    if (prevTheme.appearance !== appearance) {
      root.classList.remove("light", "dark");
      if (appearance === "system") {
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.add(systemDark ? "dark" : "light");
      } else {
        root.classList.add(appearance);
      }
      prevTheme.appearance = appearance;
    }

    // Apply Colors
    if (prevTheme.primaryColor !== primaryColor) {
      if (primaryColor) root.style.setProperty("--color-primary", primaryColor);
      else root.style.removeProperty("--color-primary");
      prevTheme.primaryColor = primaryColor;
    }

    if (prevTheme.secondaryColor !== secondaryColor) {
      if (secondaryColor) root.style.setProperty("--color-secondary", secondaryColor);
      else root.style.removeProperty("--color-secondary");
      prevTheme.secondaryColor = secondaryColor;
    }

    if (prevTheme.textColor !== textColor) {
      if (textColor) root.style.setProperty("--color-text-primary", textColor);
      else root.style.removeProperty("--color-text-primary");
      prevTheme.textColor = textColor;
    }

    // Apply Font Size
    if (prevTheme.fontSize !== fontSize) {
      const sizeMap = { small: "14px", medium: "16px", large: "18px" };
      root.style.fontSize = sizeMap[fontSize] || "16px";
      prevTheme.fontSize = fontSize;
    }
  }, [theme]);
};
