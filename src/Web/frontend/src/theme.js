import { createTheme } from "@mui/material/styles";

export function getAppTheme(mode) {
  return createTheme({
    cssVariables: {
      colorSchemeSelector: 'data-theme'
    },
    custom: {
        appBarHeight: '48px',
        boardBarHeight: '57px'
    },
    colorSchemes: {
      light: {
        palette: {
          mode: 'light',
          primary: { 
            main: "#1976d2" 
          },
          background: {
            default: '#ffffff',
            paper: '#ffffff'
          }
        },
      },
      dark: {
        palette: {
          mode: 'dark',
          primary: { 
            main: "#121212" 
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e'
          }
        },
      },
    },
    defaultColorScheme: mode,
  });
}