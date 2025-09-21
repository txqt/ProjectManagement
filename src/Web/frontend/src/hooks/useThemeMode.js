// src/useThemeMode.js
import { useContext } from 'react';
import ThemeModeContext from '~/ThemeModeContext';

export default function useThemeMode() {
  return useContext(ThemeModeContext);
}
