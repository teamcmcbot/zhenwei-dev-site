import { useEffect, useState } from "react";

const STORAGE_KEY = "zhenwei-theme";

function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [lightToggleCount, setLightToggleCount] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    if (next === "light") {
      setLightToggleCount((c) => c + 1);
    }
    setTheme(next);
  };

  const easterEggUnlocked = lightToggleCount >= 3;

  return { theme, toggleTheme, easterEggUnlocked };
}
