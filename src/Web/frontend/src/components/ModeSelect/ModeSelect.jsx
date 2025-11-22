import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, Box, Tooltip } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';

const options = {
  light: { label: 'Light', icon: <LightModeIcon fontSize="small" /> },
  dark: { label: 'Dark', icon: <DarkModeIcon fontSize="small" /> },
  system: { label: 'System', icon: <SettingsBrightnessIcon fontSize="small" /> },
};

function ModeSelect({ value, onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (mode) => {
    onChange(mode);
    handleClose();
  };

  const currentOption = options[value] || options.system;

  return (
    <>
      <Tooltip title={`Theme: ${currentOption.label}`}>
        <IconButton
          onClick={handleClick}
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          {currentOption.icon}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {Object.entries(options).map(([key, opt]) => (
          <MenuItem
            key={key}
            onClick={() => handleSelect(key)}
            selected={key === value}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {opt.icon}
              {opt.label}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default ModeSelect;

