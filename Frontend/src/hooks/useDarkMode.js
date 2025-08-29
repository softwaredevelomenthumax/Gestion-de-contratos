import { useState, useEffect } from 'react';
import { initializeTheme, toggleTheme } from '../utils/darkMode.js';

/**
 * Custom hook for managing dark mode state
 * @returns {Object} { isDark, theme, toggleDarkMode }
 */
export const useDarkMode = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Initialize theme on component mount
    const initialTheme = initializeTheme();
    setTheme(initialTheme);
  }, []);

  const toggleDarkMode = () => {
    const newTheme = toggleTheme();
    setTheme(newTheme);
  };

  const isDark = theme === 'dark';

  return {
    isDark,
    theme,
    toggleDarkMode
  };
};
