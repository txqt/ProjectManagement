import React, { useEffect, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ThemeModeContext } from "./theme-context";
import { getAppTheme } from "./theme";

export default function AppThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => {
    try {
      return localStorage.getItem("theme") || "system";
    } catch {
      return "system";
    }
  });

  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  const mode = useMemo(() => {
    if (preference === "light") return "light";
    if (preference === "dark") return "dark";
    return prefersDark ? "dark" : "light";
  }, [preference, prefersDark]);

  // Debug logs
  console.log('AppThemeProvider - preference:', preference);
  console.log('AppThemeProvider - mode:', mode);
  console.log('AppThemeProvider - prefersDark:', prefersDark);

  useEffect(() => {
    try {
      localStorage.setItem("theme", preference);
      console.log('Theme saved to localStorage:', preference);
    } catch (e){
      console.log('Error saving theme:', e);
    }
  }, [preference]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    console.log('data-theme attribute set to:', mode);
  }, [mode]);

  const theme = useMemo(() => {
    const newTheme = getAppTheme(mode);
    console.log('Theme created:', newTheme);
    return newTheme;
  }, [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, preference, setPreference }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}