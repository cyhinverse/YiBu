import { useEffect, useRef } from 'react';

export const useTheme = (theme) => {
  const prevThemeRef = useRef({
    appearance: null,
    primaryColor: null,
    fontSize: null,
  });

  useEffect(() => {
    if (!theme) return;

    const prevTheme = prevThemeRef.current;
    const { appearance, primaryColor, fontSize } = theme;

    // Apply Appearance
    if (prevTheme.appearance !== appearance) {
      const root = document.documentElement;
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
      document.documentElement.style.setProperty("--primary-color", primaryColor);
      prevTheme.primaryColor = primaryColor;
    }

    // Apply Font Size
    if (prevTheme.fontSize !== fontSize) {
      const sizeMap = { small: "14px", medium: "16px", large: "18px" };
      document.documentElement.style.fontSize = sizeMap[fontSize] || "16px";
      prevTheme.fontSize = fontSize;
    }
  }, [theme]);
};
