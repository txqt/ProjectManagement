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
import SearchBox from '../Search/SearchBox';
import AdvancedSearchDialog from '../Search/AdvancedSearchDialog';

function AppBar() {
    const { themeMode, setThemeMode } = useThemeMode();
    const { user } = useAuth();
    const [openDrawer, setOpenDrawer] = useState(false);
    const navigate = useNavigate();

    const toggleDrawer = (open) => () => {
        setOpenDrawer(open);
    };

    const [openAdvancedSearch, setOpenAdvancedSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleOpenAdvancedSearch = (query) => {
        setSearchQuery(query);
        setOpenAdvancedSearch(true);
    };

    const handleCloseAdvancedSearch = () => {
        setOpenAdvancedSearch(false);
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

            <SearchBox onAdvancedSearchClick={handleOpenAdvancedSearch} />

            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <ModeSelect label="Theme" value={themeMode} onChange={setThemeMode} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <NotificationBell />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Tooltip title="Help">
                    <HelpOutlineIcon sx={{ color: 'white' }} />
                </Tooltip>
            </Box>
        </Box>
    );

    return (
        <>
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
                        <AppsIcon />
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
                        <SearchBox onAdvancedSearchClick={handleOpenAdvancedSearch} />

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
            <AdvancedSearchDialog
                open={openAdvancedSearch}
                onClose={handleCloseAdvancedSearch}
                initialQuery={searchQuery}
            />
        </>
    );
}

export default AppBar;  