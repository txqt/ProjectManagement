import React from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useThemeMode } from '~/theme-context';

const options = {
  light: { label: 'Light', icon: <LightModeIcon fontSize="small" /> },
  dark: { label: 'Dark', icon: <DarkModeIcon fontSize="small" /> },
  system: { label: 'System', icon: <SettingsBrightnessIcon fontSize="small" /> }
};

export default function ThemeSelect({ label = 'Theme', sx }) {
  const { preference, setPreference } = useThemeMode();
  
  // Debug logs
  console.log('ThemeSelect rendered, preference:', preference);
  console.log('setPreference function:', setPreference);

  const handleChange = (e) => {
    console.log('Theme changing to:', e.target.value);
    setPreference(e.target.value);
  };

  return (
    <FormControl size="small" sx={sx}>
      <InputLabel id="theme-select-label">{label}</InputLabel>
      <Select
        labelId="theme-select-label"
        id="theme-select"
        value={preference}
        label={label}
        onChange={handleChange}
        renderValue={(selected) => {
          const { icon, label } = options[selected];
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {icon}
              <Typography>{label}</Typography>
            </Box>
          );
        }}
      >
        {Object.entries(options).map(([value, { label, icon }]) => (
          <MenuItem key={value} value={value}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {icon}
              <Typography>{label}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}