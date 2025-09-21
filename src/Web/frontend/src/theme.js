import { createTheme } from '@mui/material/styles';

const baseCustom = {
  appBarHeight: '58px',
  boardBarHeight: '60px',
};

export function makeTheme(mode = 'light') {
  return createTheme({
    palette: {
      mode: mode,
      primary: {
        main: mode === 'light' ? '#1976d2' : '#90caf9'
      }
    },
    custom: baseCustom,
  });
}