import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth.jsx';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  
  // Storage key: per-user if logged in, else device-level
  const getStorageKey = (u) => (u?.id ? `campusflow_theme_${u.id}` : 'campusflow_theme_device');

  const [theme, setTheme] = useState(() => {
    try {
      // Check device key first if not yet mounted with user
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

  // When user logs in or changes, restore their saved preference
  useEffect(() => {
    const key = getStorageKey(user);
    const saved = localStorage.getItem(key);
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
    } else {
      // Check system fallback
      const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(system);
      localStorage.setItem(key, system);
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
      // Also update generic fallback for immediate index.html inline script before auth loads
      localStorage.setItem('theme', theme);
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

