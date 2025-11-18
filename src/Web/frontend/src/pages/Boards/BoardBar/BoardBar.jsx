import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ShareIcon from '@mui/icons-material/Share';
import SettingsIcon from '@mui/icons-material/Settings';
import SignalWifi4BarIcon from '@mui/icons-material/SignalWifi4Bar';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import GroupIcon from '@mui/icons-material/Group';
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Chip,
  Tooltip
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useSignalR } from '~/hooks/useSignalR';
import { capitalizeFirstLetter } from '~/utils/formatters';
import InviteDialog from '../../../components/BoardInvites/InviteDialog';
import ShareLinkDialog from '../ShareLinkDialog/ShareLinkDialog';
import BoardBarSkeleton from './BoardBarSkeleton';
import { useAuth } from '~/hooks/useAuth';
import BoardSettingsDialog from '~/pages/Boards/BoardSettings/BoardSettingsDialog';
import { useBoardStore } from '~/stores/boardStore';
import ConditionalRender from '~/components/ConditionalRender/ConditionalRender';
import { useIsTemplateBoard } from '~/hooks/useIsTemplateBoard';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const MENU_STYPES = {
  color: 'white',
  bgcolor: 'transparent',
  border: 'none',
  paddingX: '5px',
  borderRadius: '4px',
  '.MuiSvgIcon-root': { color: 'white' },
  '&:hover': { bgcolor: 'primary.50' }
};

function formatMember(count) {
  return count === 1 ? '1 member' : `${count} members`;
}

export default function BoardBar() {
  const board = useBoardStore(state => state.board);
  const { isConnected, users } = useSignalR(board?.id);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [boardMember, setBoardMember] = useState('');
  const { user } = useAuth();
  const isTemplate = useIsTemplateBoard();

  useEffect(() => {
    if (board?.members?.length > 0) {
      const memberNames = board.members.map(m => m.user.userName).join('\n');
      const text = `${formatMember(board.members.length)}:` + '\n' + memberNames;
      setBoardMember(text);
    }
  }, [boardMember, setBoardMember, board?.members]);

  if (!board) return <BoardBarSkeleton />;

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
        <Chip sx={MENU_STYPES} icon={<DashboardIcon />} label={board.title} title="Board name" />
        <Chip sx={MENU_STYPES} icon={<VpnLockIcon />} label={capitalizeFirstLetter(board.type)} title="Board type" />

        {isTemplate && (
          <Chip 
            sx={{ ...MENU_STYPES, bgcolor: 'rgba(255, 152, 0, 0.2)' }}
            icon={<AutoAwesomeIcon />}
            label="Read Only"
            size="small"
          />
        )}

        <Tooltip title={isConnected ? 'Real-time sync active' : 'Disconnected - changes may not sync'}>
          <Chip
            sx={{ ...MENU_STYPES, bgcolor: isConnected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)' }}
            icon={isConnected ? <SignalWifi4BarIcon /> : <SignalWifiOffIcon />}
            label={isConnected ? 'Live' : 'Offline'}
            size="small"
          />
        </Tooltip>

        {boardMember && <Chip sx={MENU_STYPES} icon={<GroupIcon />} title={boardMember} />}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PersonAddIcon />}
          sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white' } }}
          onClick={() => setInviteOpen(true)}
          disabled={isTemplate} tabIndex={isTemplate ? -1 : 0}
        >
          Invite
        </Button>

        <Button
          variant="outlined"
          startIcon={<ShareIcon />}
          sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white' } }}
          onClick={() => setShareOpen(true)}
          disabled={isTemplate} tabIndex={isTemplate ? -1 : 0}
        >
          Share
        </Button>

        <ConditionalRender permission="boards.manage_members">
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white' } }}
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </Button>
        </ConditionalRender>

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
            <Tooltip key={u.id} title={`${u.userName} ${u.userName === user.userName ? '(me)' : ''}`}>
              <Avatar alt={u.userName} src={u.avatar} />
            </Tooltip>
          ))}
        </AvatarGroup>
      </Box>

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} board={board} />
      <ShareLinkDialog open={shareOpen} onClose={() => setShareOpen(false)} board={board} />
      <BoardSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </Box>
  );
}