import { useState, useEffect } from 'react';
import {
  Box,
  Tooltip,
  Chip,
  Button,
  Avatar,
  AvatarGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Pagination,
  CircularProgress,
  Snackbar,
  Alert,
  Typography
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import SignalWifi4BarIcon from '@mui/icons-material/SignalWifi4Bar';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import AddToDrive from '@mui/icons-material/AddToDrive';
import BoltIcon from '@mui/icons-material/Bolt';
import FilterListIcon from '@mui/icons-material/FilterList';
import { capitalizeFirstLetter } from '~/utils/formatters';
import { useSignalR } from '~/hooks/useSignalR';
import InviteDialog from '../../../components/BoardInvites/InviteDialog';

const MENU_STYPES = {
  color: 'white',
  bgcolor: 'transparent',
  border: 'none',
  paddingX: '5px',
  borderRadius: '4px',
  '.MuiSvgIcon-root': { color: 'white' },
  '&:hover': { bgcolor: 'primary.50' }
};

export default function BoardBar({ board }) {
  const { isConnected, users } = useSignalR(board?.id);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <Box
      sx={(theme) => ({
        width: '100%',
        height: theme.custom.boardBarHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        paddingX: 2,
        overflowX: 'auto',
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976b2')
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip sx={MENU_STYPES} icon={<DashboardIcon />} label={board?.title} clickable />
        <Chip sx={MENU_STYPES} icon={<VpnLockIcon />} label={capitalizeFirstLetter(board?.type)} clickable />

        <Tooltip title={isConnected ? 'Real-time sync active' : 'Disconnected - changes may not sync'}>
          <Chip
            sx={{ ...MENU_STYPES, bgcolor: isConnected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)' }}
            icon={isConnected ? <SignalWifi4BarIcon /> : <SignalWifiOffIcon />}
            label={isConnected ? 'Live' : 'Offline'}
            size="small"
          />
        </Tooltip>

        <Chip sx={MENU_STYPES} icon={<AddToDrive />} label="Add to Google Drive" clickable />
        <Chip sx={MENU_STYPES} icon={<BoltIcon />} label="Automation" clickable />
        <Chip sx={MENU_STYPES} icon={<FilterListIcon />} label="Filters" clickable />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PersonAddIcon />}
          sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white' } }}
          onClick={() => setInviteOpen(true)}
        >
          Invite
        </Button>

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
              boxShadow: isConnected ? '0 0 0 2px #4caf50' : 'none'
            }
          }}
        >
          {users.map(u => (
            <Tooltip key={u.id} title={`${u.userName} ${isConnected ? '(online)' : ''}`}>
              <Avatar alt={u.userName} src={u.avatar} />
            </Tooltip>
          ))}
        </AvatarGroup>
      </Box>

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} boardId={board?.id} />
    </Box>
  );
}