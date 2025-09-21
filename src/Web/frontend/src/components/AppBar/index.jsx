import React from 'react'
import { Box, Button, Typography, TextField, Badge } from "@mui/material";
import ModeSelect from "~/components/ModeSelect";
import useThemeMode from '~/hooks/useThemeMode';
import AppsIcon from '@mui/icons-material/Apps';
import TrelloIcon from '~/assets/trello.svg?react';
import SvgIcon from '@mui/material/SvgIcon';
import Workspaces from './Menus/Workspaces';
import Recent from './Menus/Recent';
import Starred from './Menus/Starred';
import Templates from './Menus/Templates';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import Tooltip from '@mui/material/Tooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Profiles from './Menus/Profiles';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';

function AppBar() {
    const { themeMode, setThemeMode } = useThemeMode();

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
                paddingX: 2
            })}
        >
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <AppsIcon sx={{ color: 'primary.main' }} />
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                }}>
                    <SvgIcon component={TrelloIcon} fontSize="small" inheritViewBox sx={{ color: 'primary.main' }} />
                    <Typography variant='span' sx={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: 'primary.main'
                    }}>
                        Trello
                    </Typography>
                </Box>

                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                    <Workspaces />
                    <Recent />
                    <Starred />
                    <Templates />

                    <Button variant="outlined" startIcon={<LibraryAddIcon />}>Create</Button>
                </Box>
            </Box>

            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <TextField id="outlined-search" label="Search..." type="search" size="small" sx={{ minWidth: '120px' }} />
                <ModeSelect label="Theme" value={themeMode} onChange={setThemeMode} />

                <Tooltip title="Notifications">
                    <Badge color="secondary" variant="dot" sx={{ cursor: 'pointer' }}>
                        <NotificationsNoneIcon sx={{ color: 'primary.main' }} />
                    </Badge>
                </Tooltip>

                <Tooltip title="Help" sx={{ cursor: 'pointer', color: 'primary.main' }}>
                    <HelpOutlineIcon />
                </Tooltip>

                <Profiles />
            </Box>
        </Box>
    )
}

export default AppBar