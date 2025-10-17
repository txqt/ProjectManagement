import AppsIcon from '@mui/icons-material/Apps';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import {
    Box,
    InputAdornment,
    TextField,
    Typography,
    Button,
    IconButton,
    Drawer,
    Divider,
    Tooltip
} from "@mui/material";
import SvgIcon from '@mui/material/SvgIcon';
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import TrelloIcon from '~/assets/trello.svg?react';
import ModeSelect from "~/components/ModeSelect/ModeSelect";
import NotificationBell from '~/components/Notifications/NotificationBell';
import { useAuth } from '~/hooks/useAuth';
import useThemeMode from '~/hooks/useThemeMode';
import Profiles from './Menus/Profiles';

function AppBar() {
    const { themeMode, setThemeMode } = useThemeMode();
    const { user } = useAuth();
    const [searchValue, setSearchValue] = useState('');
    const [openDrawer, setOpenDrawer] = useState(false);
    const navigate = useNavigate();

    const toggleDrawer = (open) => () => {
        setOpenDrawer(open);
    };

    const menuContent = (
        <Box sx={{ width: 250, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ color: 'white' }}>Menu</Typography>
                <IconButton onClick={toggleDrawer(false)} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <TextField
                id="outlined-search"
                label="Search..."
                type="text"
                size="small"
                fullWidth
                sx={{
                    '& label': { color: 'white' },
                    '& input': { color: 'white' },
                    '& label.Mui-focused': { color: 'white' },
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'white' },
                        '&:hover fieldset': { borderColor: 'white' },
                        '&.Mui-focused fieldset': { borderColor: 'white' }
                    }
                }}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                slotProps={{
                    startAdornment: (
                        <InputAdornment position='start'>
                            <SearchIcon sx={{ color: 'white' }} />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <CloseIcon
                            fontSize='small'
                            sx={{ color: searchValue ? 'white' : 'transparent', cursor: 'pointer' }}
                            onClick={() => setSearchValue('')}
                        />
                    )
                }}
            />

            <Divider sx={{ my: 2 }} />
            <ModeSelect label="Theme" value={themeMode} onChange={setThemeMode} />
            <Box sx={{ mt: 2 }}>
                <NotificationBell />
            </Box>
            <Box sx={{ mt: 2, ml: 1 }}>
                <Tooltip title="Help">
                    <HelpOutlineIcon sx={{ color: 'white' }} />
                </Tooltip>
            </Box>
        </Box>
    );

    return (
        <Box
            sx={(theme) => ({
                width: "100%",
                height: theme.custom.appBarHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: 'space-between',
                paddingX: 2,
                bgcolor: theme.palette.mode === 'dark' ? '#2c3e50' : '#1565c0'
            })}
        >
            {/* Left section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton
                    color="inherit"
                    sx={{ display: { xs: 'flex', md: 'none' }, color: 'white' }}
                    onClick={toggleDrawer(true)}
                >
                    <AppsIcon/>
                </IconButton>

                <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }}
                    onClick={() => navigate("/")}
                >
                    <SvgIcon
                        component={TrelloIcon}
                        fontSize="small"
                        inheritViewBox
                        sx={{ color: "white" }}
                    />
                    <Typography
                        variant="h6"
                        sx={{
                            fontSize: "1.2rem",
                            fontWeight: "bold",
                            color: "white"
                        }}
                    >
                        Trello
                    </Typography>
                </Box>

                {/* Chỉ hiển thị trên PC */}
                <Box sx={{ display: { md: 'flex' }, gap: 1 }}>
                    <Button
                        onClick={() => navigate("/boards/invites")}
                        sx={{
                            color: 'white',
                            border: 'none',
                            '&:hover': { border: 'none' }
                        }}
                        variant="outlined"
                        startIcon={<AddIcon />}
                    >
                        Board Invites
                    </Button>
                </Box>
            </Box>

            {/* Right section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Ẩn trên mobile */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
                    <TextField
                        label="Search..."
                        type="text"
                        size="small"
                        sx={{
                            minWidth: '120px',
                            maxWidth: '170px',
                            '& label': { color: 'white' },
                            '& input': { color: 'white' },
                            '& label.Mui-focused': { color: 'white' },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: 'white' },
                                '&:hover fieldset': { borderColor: 'white' },
                                '&.Mui-focused fieldset': { borderColor: 'white' }
                            }
                        }}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        slotProps={{
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <SearchIcon sx={{ color: 'white' }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <CloseIcon
                                    fontSize='small'
                                    sx={{ color: searchValue ? 'white' : 'transparent', cursor: 'pointer' }}
                                    onClick={() => setSearchValue('')}
                                />
                            )
                        }}
                    />

                    <ModeSelect label="Theme" value={themeMode} onChange={setThemeMode} />
                    <NotificationBell />
                    <Tooltip title="Help">
                        <HelpOutlineIcon sx={{ color: 'white' }} />
                    </Tooltip>
                </Box>

                {/* Profile luôn hiển thị */}
                <Profiles user={user} />
            </Box>

            {/* Drawer for mobile */}
            <Drawer anchor="left" open={openDrawer} onClose={toggleDrawer(false)}>
                <Box
                    sx={{
                        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#2c3e50' : '#1565c0'),
                        height: '100%',
                        color: 'white'
                    }}
                >
                    {menuContent}
                </Box>
            </Drawer>
        </Box>
    );
}

export default AppBar;  