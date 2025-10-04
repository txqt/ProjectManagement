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

function InviteDialog({ open, onClose, board }) {
  const { createBoardInvite, loadBoardInvites, cancelInvite, resendInvite } = useInvites();

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // track sending/resending/cancelling by email (lowercase)
  const [sendingEmails, setSendingEmails] = useState(new Set());
  const [resendingEmails, setResendingEmails] = useState(new Set());
  const [cancellingEmails, setCancellingEmails] = useState(new Set());

  // invitedMap: email(lowercase) => inviteId
  const [invitedMap, setInvitedMap] = useState(new Map());
  const [invitedMapLoaded, setInvitedMapLoaded] = useState(false);

  const [role, setRole] = useState('member');
  const [message, setMessage] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', message: '' });

  // load existing invites (by email) when dialog opens
  useEffect(() => {
    let mounted = true;
    if (!open || !board.id) {
      setInvitedMapLoaded(false);
      return;
    }
    setInvitedMapLoaded(false);
    (async () => {
      try {
        const invites = await loadBoardInvites(board.id, 'pending');
        if (!mounted) return;
        const map = new Map();
        (invites || []).forEach(i => {
          const email = (i.inviteeEmail || i.email || '').toLowerCase();
          if (email) map.set(email, i.id || i.inviteId || null);
        });
        setInvitedMap(map);
        setInvitedMapLoaded(true);
      } catch (err) {
        console.error('loadBoardInvites failed', err);
        setInvitedMap(new Map());
        setInvitedMapLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, [open, board.id, loadBoardInvites]);

  // debounced search - only run if invitedMap is loaded
  useEffect(() => {
    const t = setTimeout(() => {
      const q = (query || '').trim();
      if (!q || !invitedMapLoaded) {
        setResults([]);
        setTotalPages(1);
        return;
      }
      (async () => {
        try {
          setLoading(true);
          const res = await apiService.searchUsers(q, page);
          const items = (res.items || []).map(u => {
            const emailKey = (u.email || '').toLowerCase();
            return {
              ...u,
              invited: invitedMap.has(emailKey),
              inviteId: invitedMap.get(emailKey) || null
            };
          });
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
  }, [query, page, invitedMap, invitedMapLoaded]);

  // reset non-persistent fields when close
  useEffect(() => {
    if (!open) {
      setQuery('');
      setPage(1);
      setResults([]);
      setTotalPages(1);
      setLoading(false);
      setSendingEmails(new Set());
      setResendingEmails(new Set());
      setCancellingEmails(new Set());
      setInvitedMap(new Map());
      setInvitedMapLoaded(false);
      setRole('member');
      setMessage('');
    }
  }, [open]);

  const showSnackbar = (severity, message) => {
    setSnackbar({ open: true, severity, message });
  };

  const handleInvite = async (user) => {
    const inviteeEmail = (user.email || '').trim();
    if (!inviteeEmail) {
      showSnackbar('error', 'User has no email.');
      return;
    }
    const emailKey = inviteeEmail.toLowerCase();

    try {
      setSendingEmails(prev => { const s = new Set(prev); s.add(emailKey); return s; });
      const dto = {
        inviteeEmail,
        role: role || 'member',
        message: message || null
      };
      const result = await createBoardInvite(board.id, dto);
      if (result && result.success) {
        const created = result.data || {};
        const newInviteId = created.id || created.inviteId || null;

        setInvitedMap(prev => {
          const m = new Map(prev);
          m.set(emailKey, newInviteId);
          return m;
        });

        setResults(prev => prev.map(r => (r.email && r.email.toLowerCase() === emailKey ? { ...r, invited: true, inviteId: newInviteId } : r)));
        showSnackbar('success', 'Đã gửi lời mời');
      } else {
        showSnackbar('error', result?.message || 'Gửi invite thất bại');
      }
    } catch (err) {
      console.error('createBoardInvite error', err);
      showSnackbar('error', err?.message || 'Lỗi');
    } finally {
      setSendingEmails(prev => {
        const s = new Set(prev);
        s.delete(emailKey);
        return s;
      });
    }
  };

  const handleResend = async (user) => {
    const inviteeEmail = (user.email || '').trim();
    if (!inviteeEmail) {
      showSnackbar('error', 'User has no email.');
      return;
    }
    const emailKey = inviteeEmail.toLowerCase();
    // Always get inviteId from invitedMap (current state)
    const inviteId = invitedMap.get(emailKey);

    if (!inviteId) {
      showSnackbar('error', 'Không tìm thấy inviteId để gửi lại.');
      return;
    }

    try {
      setResendingEmails(prev => { const s = new Set(prev); s.add(emailKey); return s; });
      const result = await resendInvite(board.id, inviteId);
      if (result && result.success) {
        showSnackbar('success', 'Gửi lại lời mời thành công');
      } else {
        showSnackbar('error', result?.message || 'Gửi lại thất bại');
      }
    } catch (err) {
      console.error('resend invite error', err);
      showSnackbar('error', err?.message || 'Lỗi');
    } finally {
      setResendingEmails(prev => {
        const s = new Set(prev);
        s.delete(emailKey);
        return s;
      });
    }
  };

  const handleCancel = async (user) => {
    const inviteeEmail = (user.email || '').trim();
    if (!inviteeEmail) {
      showSnackbar('error', 'User has no email.');
      return;
    }
    const emailKey = inviteeEmail.toLowerCase();
    // Always get inviteId from invitedMap (current state)
    const inviteId = invitedMap.get(emailKey);

    if (!inviteId) {
      showSnackbar('error', 'Không tìm thấy inviteId để hủy.');
      return;
    }

    try {
      setCancellingEmails(prev => { const s = new Set(prev); s.add(emailKey); return s; });
      const result = await cancelInvite(board.id, inviteId);
      if (result && result.success) {
        setInvitedMap(prev => {
          const m = new Map(prev);
          m.delete(emailKey);
          return m;
        });
        setResults(prev => prev.map(r => (r.email && r.email.toLowerCase() === emailKey ? { ...r, invited: false, inviteId: null } : r)));
        showSnackbar('success', 'Đã hủy lời mời');
      } else {
        showSnackbar('error', result?.message || 'Hủy lời mời thất bại');
      }
    } catch (err) {
      console.error('cancel invite error', err);
      showSnackbar('error', err?.message || 'Lỗi');
    } finally {
      setCancellingEmails(prev => {
        const s = new Set(prev);
        s.delete(emailKey);
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

          {!loading && results.length === 0 && query.trim() !== '' && invitedMapLoaded && (
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>Không tìm thấy người dùng.</Typography>
          )}

          <List>
            {results.map(u => {
              const emailKey = (u.email || '').toLowerCase();
              const isSending = sendingEmails.has(emailKey);
              const isResending = resendingEmails.has(emailKey);
              const isCancelling = cancellingEmails.has(emailKey);
              const hasJoined = board.members?.some(m => m.user?.email?.toLowerCase() === emailKey);

              return (
                <ListItem key={u.id || u.email} secondaryAction={
                  hasJoined ? (
                    <Button size="small" variant="outlined" disabled>
                      Joined
                    </Button>
                  ) : u.invited ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        onClick={() => handleResend(u)}
                        disabled={isResending || isCancelling}
                        variant="contained"
                      >
                        {isResending ? '...' : 'Gửi lại'}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleCancel(u)}
                        disabled={isCancelling || isResending}
                        variant="outlined"
                      >
                        {isCancelling ? '...' : 'Hủy'}
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      variant="contained"
                      size="small"
                      disabled={isSending}
                      onClick={() => handleInvite(u)}
                    >
                      {isSending ? '...' : 'Invite'}
                    </Button>
                  )
                }>
                  <ListItemAvatar>
                    <Avatar src={u.avatar} alt={u.userName} />
                  </ListItemAvatar>
                  <ListItemText primary={u.userName} secondary={u.email} />
                </ListItem>
              );
            })}
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