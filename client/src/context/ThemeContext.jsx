import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth.jsx';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  
  // Storage key: per-user if logged in (campusflow_theme_${userId}), else device-level (campusflow_theme_device)
  const getStorageKey = (u) => (u?.id ? `campusflow_theme_${u.id}` : 'campusflow_theme_device');

  const [theme, setTheme] = useState(() => {
    try {
      const rawUser = localStorage.getItem('campusflow_user');
      const u = rawUser ? JSON.parse(rawUser) : null;
      const key = getStorageKey(u);
      const saved = localStorage.getItem(key);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // When user logs in/out or switches, restore their specific saved preference
  useEffect(() => {
    const key = getStorageKey(user);
    const saved = localStorage.getItem(key);
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
    } else {
      // First visit for this user: follow system preference
      const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(system);
      try {
        localStorage.setItem(key, system);
      } catch (_) {}
    }
  }, [user?.id]);

  // Sync DOM <html> class and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const key = getStorageKey(user);
    try {
      localStorage.setItem(key, theme);
      localStorage.setItem('campusflow_theme_device', theme);
    } catch (_) {}
  }, [theme, user?.id]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
