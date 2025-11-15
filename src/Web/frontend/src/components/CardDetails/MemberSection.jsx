import React, { useState, useEffect } from 'react';
import {
    Avatar, Box, IconButton, Tooltip, Menu, MenuItem,
    TextField, CircularProgress, Typography, Divider, Chip, Paper
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import { useBoardStore } from '~/stores/boardStore';
import { apiService } from '~/services/api';
import { toast } from 'react-toastify';

const getUserIdFrom = (item) => item?.user?.id ?? item?.userId ?? item?.id ?? null;
const getUserEmailFrom = (item) => item?.user?.email ?? item?.email ?? item?.userEmail ?? null;
const getDisplayNameFrom = (item) => item?.user?.userName ?? item?.userName ?? item?.name ?? 'Unknown';
const getAvatarFrom = (item) => item?.user?.avatar ?? item?.avatar ?? null;

export default function MemberSection({ card }) {
    const boardMembers = useBoardStore(s => s.board?.members ?? []);
    const assignCardMember = useBoardStore(s => s.assignCardMember);
    const unassignCardMember = useBoardStore(s => s.unassignCardMember);

    const [anchor, setAnchor] = useState(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const isUserAssignedToCard = (cardObj, userIdOrEmail) => {
        if (!cardObj?.members) return false;
        return cardObj.members.some(m => {
            const mid = getUserIdFrom(m);
            const memEmail = getUserEmailFrom(m);
            return (mid && mid === userIdOrEmail) || (memEmail && memEmail === userIdOrEmail);
        });
    };

    const handleOpen = (e) => {
        setAnchor(e.currentTarget);
        setQuery('');
        setResults(boardMembers.slice(0, 6));
    };
    const handleClose = () => {
        setAnchor(null);
        setQuery('');
        setResults([]);
    };

    useEffect(() => {
        if (!anchor) return;
        let mounted = true;
        const timer = setTimeout(async () => {
            if (!mounted) return;
            const q = (query || '').trim().toLowerCase();
            setLoading(true);
            try {
                if (!q) {
                    setResults(boardMembers.slice(0, 6));
                } else {
                    // local filter
                    const local = boardMembers.filter(m => {
                        const name = (getDisplayNameFrom(m) || '').toLowerCase();
                        const email = (getUserEmailFrom(m) || '').toLowerCase();
                        return name.includes(q) || email.includes(q);
                    });
                    const results = [...local];
                    if (results.length < 6) {
                        try {
                            const apiRes = await apiService.searchUsers(q, 1, 6);
                            const remote = (apiRes?.items ?? []).filter(u => {
                                const uid = getUserIdFrom(u);
                                const email = getUserEmailFrom(u);
                                return !boardMembers.some(bm =>
                                    getUserIdFrom(bm) === uid || getUserEmailFrom(bm) === email
                                );
                            });
                            for (let i = 0; i < remote.length && results.length < 6; i++) results.push(remote[i]);
                        } catch (err) {
                            console.error('searchUsers error', err);
                        }
                    }
                    setResults(results.slice(0, 6));
                }
            } finally {
                setLoading(false);
            }
        }, 250);
        return () => { mounted = false; clearTimeout(timer); setLoading(false); };
    }, [query, boardMembers, anchor]);

    const handleAssign = async (item) => {
        if (!card) return;
        const email = getUserEmailFrom(item);
        try {
            await assignCardMember(card.columnId, card.id, email);
            toast.success('Member added');
        } catch (err) {
            console.error('assign error', err);
            toast.error('Failed to add member');
        }
    };

    const handleUnassign = async (member) => {
        if (!card) return;
        const id = getUserIdFrom(member) ?? member.id;
        try {
            await unassignCardMember(card.columnId, card.id, id);
            toast.success('Member removed');
        } catch (err) {
            console.error('unassign error', err);
            toast.error('Failed to remove member');
        }
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <GroupIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="subtitle2" fontWeight={600}>Members</Typography>
            </Box>

            <Paper sx={{ p: 2, mt: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    {card.members?.map(m => {
                        const display = getDisplayNameFrom(m);
                        return (
                            <Tooltip key={getUserIdFrom(m) ?? display} title={`${display} - Click to remove`}>
                                <Avatar
                                    src={getAvatarFrom(m)}
                                    sx={{ width: 32, height: 32, cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
                                    onClick={() => {
                                        if (window.confirm(`Remove ${display}?`)) handleUnassign(m);
                                    }}
                                >
                                    {display?.[0]?.toUpperCase() ?? '?'}
                                </Avatar>
                            </Tooltip>
                        );
                    })}

                    <IconButton
                        size="small"
                        onClick={handleOpen}
                        sx={{ width: 32, height: 32, bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
                    >
                        <GroupIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={handleClose} PaperProps={{ sx: { width: 320, maxHeight: 400 } }}>
                    <Box sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Add Member</Typography>
                        <TextField fullWidth size="small" placeholder="Search members..." value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
                    </Box>
                    <Divider />
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                        {loading ? (
                            <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={20} /></Box>
                        ) : results.length === 0 ? (
                            <Box sx={{ p: 2, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">No members found</Typography></Box>
                        ) : results.map(item => {
                            const uid = getUserIdFrom(item);
                            const display = getDisplayNameFrom(item);
                            const avatar = getAvatarFrom(item);
                            const isAssigned = isUserAssignedToCard(card, uid);
                            return (
                                <MenuItem key={uid ?? display} onClick={async () => { if (!isAssigned) await handleAssign(item); handleClose(); }} disabled={isAssigned}>
                                    <Avatar src={avatar} sx={{ width: 32, height: 32, mr: 2 }}>{display?.[0]?.toUpperCase()}</Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2">{display}</Typography>
                                        <Typography variant="caption" color="text.secondary">{getUserEmailFrom(item)}</Typography>
                                    </Box>
                                    {isAssigned && <Chip label="Member" size="small" color="primary" />}
                                </MenuItem>
                            );
                        })}
                    </Box>
                </Menu>
            </Paper>
        </Box>
    );
}