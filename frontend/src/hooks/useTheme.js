'use client';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'nubex_theme';

export function useTheme() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  };

  return { theme, toggleTheme };
}
