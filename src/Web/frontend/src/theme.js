import { createTheme } from '@mui/material/styles';

const baseCustom = {
  appBarHeight: '58px',
  boardBarHeight: '60px',
};

export function makeTheme(mode = 'light') {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
          primary: {
            light: '#63a4ff',
            main: '#1976d2',
            dark: '#004ba0',
          },
          background: { default: '#f5f5f5', paper: '#fff' },
          text: { primary: '#000' },
        }
        : {
          primary: {
            light: '#bbdefb',
            main: '#90caf9',
            dark: '#42a5f5',
          },
          background: { default: '#121212', paper: '#1e1e1e' },
          text: { primary: '#fff' },
        }),
    },
    custom: baseCustom,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            '*::-webkit-scrollbar': {
              width: '8px',
              height: '8px'
            },
            '*::-webkit-scrollbar-thumb': {
              backgroundColor: '#bdc3c7',
              borderRadius: '8px'
            }
            ,
            '*::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#00b894'
            }
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.primary.main,
            fontSize: '0.875rem',
          }),
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.primary.main,
            fontSize: '0.875rem',
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.light,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
            '& fieldset': {
              borderWidth: '1px !important',
            },
          }),
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: ({ theme }) => ({
            color: theme.palette.primary.main,
          }),
        },
      },
    },
  });
}
