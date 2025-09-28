import { Box, Tooltip, Chip } from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import AddToDrive from "@mui/icons-material/AddToDrive";
import BoltIcon from '@mui/icons-material/Bolt';
import FilterListIcon from '@mui/icons-material/FilterList';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Button from "@mui/material/Button";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import SignalWifi4BarIcon from '@mui/icons-material/SignalWifi4Bar';
import { capitalizeFirstLetter } from "~/utils/formatters";
import { useState, useEffect } from 'react';
import { useSignalR } from '~/hooks/useSignalR';

const MENU_STYPES = {
    color: 'white',
    bgcolor: 'transparent',
    border: 'none',
    paddingX: '5px',
    borderRadius: '4px',
    '.MuiSvgIcon-root': {
        color: 'white'
    },
    '&:hover': {
        bgcolor: 'primary.50'
    }
}

function BoardBar({ board }) {
    const { isConnected, users } = useSignalR(board?.id);

    useEffect(() => {
        if (!isConnected) return;
    }, [isConnected]);

    return (
        <Box
            sx={(theme) => ({
                width: "100%",
                height: theme.custom.boardBarHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: 'space-between',
                gap: 2,
                paddingX: 2,
                overflowX: 'auto',
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976b2'),
            })}
        >
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <Chip
                    sx={MENU_STYPES}
                    icon={<DashboardIcon />}
                    label={board?.title}
                    clickable
                />
                <Chip
                    sx={MENU_STYPES}
                    icon={<VpnLockIcon />}
                    label={capitalizeFirstLetter(board?.type)}
                    clickable
                />
                
                {/* Connection Status */}
                <Tooltip title={isConnected ? "Real-time sync active" : "Disconnected - changes may not sync"}>
                    <Chip
                        sx={{
                            ...MENU_STYPES,
                            bgcolor: isConnected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'
                        }}
                        icon={isConnected ? <SignalWifi4BarIcon /> : <SignalWifiOffIcon />}
                        label={isConnected ? "Live" : "Offline"}
                        size="small"
                    />
                </Tooltip>

                <Chip
                    sx={MENU_STYPES}
                    icon={<AddToDrive />}
                    label="Add to Google Drive"
                    clickable
                />
                <Chip
                    sx={MENU_STYPES}
                    icon={<BoltIcon />}
                    label="Automation"
                    clickable
                />
                <Chip
                    sx={MENU_STYPES}
                    icon={<FilterListIcon />}
                    label="Filters"
                    clickable
                />
            </Box>

            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <Button
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                    sx={{
                        color: 'white',
                        borderColor: 'white',
                        '&:hover': { borderColor: 'white' }
                    }}
                >
                    Invite
                </Button>
                
                {/* Online Users */}
                <AvatarGroup
                    max={4}
                    sx={{
                        gap: '10px',
                        '& .MuiAvatar-root': {
                            width: 36,
                            height: 36,
                            fontSize: 16,
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            '&:first-of-type': { bgcolor: '#a4b0be' },
                            // Thêm green border cho online users
                            boxShadow: isConnected ? '0 0 0 2px #4caf50' : 'none'
                        }
                    }}
                >
                    {users.map((user) => (
                        <Tooltip key={user.id} title={`${user.displayName} ${isConnected ? '(online)' : ''}`}>
                            <Avatar
                                alt={user.displayName}
                                src={user.avatar}
                            />
                        </Tooltip>
                    ))}
                </AvatarGroup>
            </Box>
        </Box>
    )
}

export default BoardBar