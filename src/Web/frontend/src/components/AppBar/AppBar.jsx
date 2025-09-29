import AppsIcon from '@mui/icons-material/Apps';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SearchIcon from '@mui/icons-material/Search';
import { Box, InputAdornment, TextField, Typography } from "@mui/material";
import SvgIcon from '@mui/material/SvgIcon';
import Tooltip from '@mui/material/Tooltip';
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
    const navigate = useNavigate();

    return (
        <Box
            sx={(theme) => ({
                width: "100%",
                height: theme.custom.appBarHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: 'space-between',
                gap: 2,
                overflowX: 'auto',
                paddingX: 2,
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#2c3e50' : '#1565c0')
            })}
        >
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <AppsIcon sx={{ color: 'white' }} />
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        cursor: "pointer" // thêm để gợi ý người dùng click
                    }}
                    onClick={() => navigate("/")}
                >
                    <SvgIcon
                        component={TrelloIcon}
                        fontSize="small"
                        inheritViewBox
                        sx={{ color: "white" }}
                    />
                    <Typography
                        component="span"
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

                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                    {/* 
                    <Workspaces />
                    <Recent />
                    <Starred />
                    <Templates />

                    <Button
                        sx={{
                            color: 'white',
                            border: 'none',
                            '&:hover': {
                                border: 'none'
                            }
                        }}
                        variant="outlined"
                        startIcon={<LibraryAddIcon />}
                    >
                        Create
                    </Button> 
                    */}
                </Box>
            </Box>

            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <TextField
                    id="outlined-search"
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
                            '& fieldset': {
                                borderColor: 'white',
                            },
                            '&:hover fieldset': {
                                borderColor: 'white',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: 'white',
                            }
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

                <Tooltip title="Help" sx={{ cursor: 'pointer', color: 'white' }}>
                    <HelpOutlineIcon />
                </Tooltip>

                <Profiles user={user} />
            </Box>
        </Box>
    )
}

export default AppBar