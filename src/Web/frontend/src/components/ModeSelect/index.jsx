import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';

const options = {
  light: { label: 'Light', icon: <LightModeIcon fontSize="small" /> },
  dark: { label: 'Dark', icon: <DarkModeIcon fontSize="small" /> },
  system: { label: 'System', icon: <SettingsBrightnessIcon fontSize="small" /> },
};

function ModeSelect({ label, value, onChange }) {
  return (
    <FormControl size="small" sx={{ minWidth: '120px' }}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        renderValue={(selected) => {
          const option = options[selected];
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {option.icon}
              {option.label}
            </Box>
          );
        }}
      >
        {Object.entries(options).map(([key, opt]) => (
          <MenuItem key={key} value={key}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {opt.icon}
              {opt.label}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default ModeSelect;
