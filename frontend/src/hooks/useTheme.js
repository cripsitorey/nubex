'use client';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'nubex_theme';

// El modo lógico ('dark'/'light') es lo que guardamos y con lo que decide
// el resto de la app; el nombre real del tema daisyUI es otro (ver globals.css)
// para no chocar con los temas built-in "dark"/"light" de daisyUI.
export const THEME_NAMES = { dark: 'nubexdark', light: 'nubexlight' };

function modeFromThemeName(name) {
  return name === THEME_NAMES.light ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setTheme(modeFromThemeName(document.documentElement.getAttribute('data-theme')));
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', THEME_NAMES[next]);
    localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  };

  return { theme, toggleTheme };
}
