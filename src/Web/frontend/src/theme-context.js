import { createContext, useContext } from "react";

export const ThemeModeContext = createContext({
  mode: "light",        // 'light' | 'dark'
  preference: "system", // 'light' | 'dark' | 'system'
  setPreference: () => {}
});

export function useThemeMode() {
  return useContext(ThemeModeContext);
}