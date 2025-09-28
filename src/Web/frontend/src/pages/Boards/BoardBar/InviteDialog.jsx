// InviteDialog (modified to send CreateBoardInviteDto shape)
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Box,
  Pagination,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { useInvites } from '~/hooks/useInvites';
import { apiService } from '~/services/api';

function InviteDialog({ open, onClose, boardId }) {
  const { createBoardInvite, loadBoardInvites } = useInvites();

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(new Set());
  const [invitedEmails, setInvitedEmails] = useState(new Set());
  const [role, setRole] = useState('member'); // default role
  const [message, setMessage] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', message: '' });

  // load existing invites (by email) when dialog opens
  useEffect(() => {
    let mounted = true;
    if (!open || !boardId) return;
    (async () => {
      try {
        const invites = await loadBoardInvites(boardId);
        if (!mounted) return;
        // expects invites array with InviteeEmail (or email)
        const emails = new Set((invites || []).map(i => (i.inviteeEmail || i.email || '').toLowerCase()));
        setInvitedEmails(emails);
      } catch (err) {
        console.error('loadBoardInvites failed', err);
        setInvitedEmails(new Set());
      }
    })();
    return () => { mounted = false; };
  }, [open, boardId, loadBoardInvites]);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      const q = (query || '').trim();
      if (!q) {
        setResults([]);
        setTotalPages(1);
        return;
      }
      (async () => {
        try {
          setLoading(true);
          const res = await apiService.searchUsers(q, page);
          // mark invited by email
          const items = (res.items || []).map(u => ({
            ...u,
            invited: invitedEmails.has((u.email || '').toLowerCase())
          }));
          setResults(items);
          setTotalPages(res.totalPages || 1);
        } catch (err) {
          console.error('searchUsers failed', err);
          setResults([]);
          setTotalPages(1);
        } finally {
          setLoading(false);
        }
      })();
    }, 300);
    return () => clearTimeout(t);
  }, [query, page, invitedEmails]);

  // reset non-persistent fields when close
  useEffect(() => {
    if (!open) {
      setQuery('');
      setPage(1);
      setResults([]);
      setTotalPages(1);
      setLoading(false);
      setSendingEmails(new Set());
      setRole('member');
      setMessage('');
    }
  }, [open]);

  const handleInvite = async (user) => {
    const inviteeEmail = (user.email || '').trim();
    if (!inviteeEmail) {
      setSnackbar({ open: true, severity: 'error', message: 'User has no email.' });
      return;
    }

    try {
      setSendingEmails(prev => new Set(prev).add(inviteeEmail));
      // build CreateBoardInviteDto shape
      const dto = {
        inviteeEmail,
        role: role || 'member',
        message: message || null
      };
      const result = await createBoardInvite(boardId, dto);
      if (result.success) {
        // disable invite button for this email immediately
        setInvitedEmails(prev => {
          const s = new Set(prev);
          s.add(inviteeEmail.toLowerCase());
          return s;
        });
        setResults(prev => prev.map(r => r.email && r.email.toLowerCase() === inviteeEmail.toLowerCase() ? { ...r, invited: true } : r));
        setSnackbar({ open: true, severity: 'success', message: 'Đã gửi lời mời' });
      } else {
        setSnackbar({ open: true, severity: 'error', message: result.message || 'Gửi invite thất bại' });
      }
    } catch (err) {
      console.error('createBoardInvite error', err);
      setSnackbar({ open: true, severity: 'error', message: err.message || 'Lỗi' });
    } finally {
      setSendingEmails(prev => {
        const s = new Set(prev);
        s.delete(inviteeEmail);
        return s;
      });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Invite users to board</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            placeholder="Search by username or email..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            sx={{ mb: 2 }}
          />

          {/* role + message area (affects next invites) */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="invite-role-label">Role</InputLabel>
              <Select
                labelId="invite-role-label"
                value={role}
                label="Role"
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              fullWidth
              placeholder="Optional message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Box>

          {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={28} /></Box>}

          {!loading && results.length === 0 && query.trim() !== '' && (
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>Không tìm thấy người dùng.</Typography>
          )}

          <List>
            {results.map(u => (
              <ListItem key={u.id || u.email} secondaryAction={
                <Button
                  variant="contained"
                  size="small"
                  disabled={u.invited || sendingEmails.has((u.email || '').toLowerCase())}
                  onClick={() => handleInvite(u)}
                >
                  {sendingEmails.has((u.email || '').toLowerCase()) ? '...' : (u.invited ? 'Invited' : 'Invite')}
                </Button>
              }>
                <ListItemAvatar>
                  <Avatar src={u.avatar} alt={u.userName} />
                </ListItemAvatar>
                <ListItemText primary={u.userName} secondary={u.email} />
              </ListItem>
            ))}
          </List>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default InviteDialog;