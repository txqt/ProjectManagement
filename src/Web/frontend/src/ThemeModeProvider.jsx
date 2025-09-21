import React, { useEffect, useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline, useMediaQuery } from '@mui/material';
import { makeTheme } from './theme';
import ThemeModeContext from './ThemeModeContext';

export function ThemeModeProvider({ children }) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [themeMode, setThemeMode] = useState('system');

  // Load saved theme mode
  useEffect(() => {
    const saved = typeof window !== 'undefined' && localStorage.getItem('themeMode');
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setThemeMode(saved);
    }
  }, []);

  // Save theme mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { 
        localStorage.setItem('themeMode', themeMode); 
      } catch (error) {
        console.warn('Failed to save theme mode to localStorage:', error);
      }
    }
  }, [themeMode]);

  // Calculate actual mode
  const actualMode = useMemo(() => {
    if (themeMode === 'system') {
      return prefersDark ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, prefersDark]);

  // Create theme
  const theme = useMemo(() => makeTheme(actualMode), [actualMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ThemeModeContext.Provider value={{ themeMode, setThemeMode }}>
        {children}
      </ThemeModeContext.Provider>
    </ThemeProvider>
  );
}