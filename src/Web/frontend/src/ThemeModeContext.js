import React from 'react';

const ThemeModeContext = React.createContext({
  themeMode: 'system',    // 'light' | 'dark' | 'system'
  setThemeMode: () => {}, // placeholder
});

export default ThemeModeContext;