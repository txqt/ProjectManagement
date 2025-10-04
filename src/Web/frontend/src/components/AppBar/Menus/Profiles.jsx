import React from 'react'
import Box from "@mui/material/Box"
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';
import { useAuth } from '~/hooks/useAuth';

function Profiles({ user }) {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const { logout } = useAuth();
    
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        handleClose();
    };
    
    return (
        <Box>
            <Tooltip title="Account settings">
                <IconButton
                    onClick={handleClick}
                    size="small"
                    sx={{ padding: 0 }}
                    aria-controls={open ? 'basic-menu-profiles' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                >
                    <Avatar sx={{ width: 36, height: 36 }}
                        alt={user?.userName || 'User'}
                        src={user?.avatar || "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/avatar_vo_tri_a49436c5de.jpg"}
                    />
                </IconButton>
            </Tooltip>
            <Menu
                id="basic-menu-profiles"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                slotProps={{
                    list: {
                        'aria-labelledby': 'basic-button-profiles',
                    },
                }}
            >
                {/* <MenuItem onClick={handleClose}>
                    <Avatar sx={{width: '28px', height: '28px', mr: 2}}/> Profile
                </MenuItem> */}
                <MenuItem onClick={handleClose}>
                    <Avatar sx={{width: '28px', height: '28px', mr: 2}}/> {user.userName}
                </MenuItem>
                <Divider />
                {/* <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                        <PersonAdd fontSize="small" />
                    </ListItemIcon>
                    Add another account
                </MenuItem> */}
                {/* <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                        <Settings fontSize="small" />
                    </ListItemIcon>
                    Settings
                </MenuItem> */}
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <Logout fontSize="small" />
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>
        </Box>
    )
}

export default Profiles