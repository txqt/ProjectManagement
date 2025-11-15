import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    Paper,
    Menu,
    MenuItem,
    Collapse
} from '@mui/material';
import {
    Send as SendIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    MoreVert as MoreVertIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import { useBoardStore } from '~/stores/boardStore';
import { useAuth } from '~/hooks/useAuth';
import CommentIcon from '@mui/icons-material/Comment';

const CommentSection = ({ card, initialOpen = true }) => {
    const { user } = useAuth();
    const createComment = useBoardStore(s => s.createComment);
    const updateComment = useBoardStore(s => s.updateComment);
    const deleteComment = useBoardStore(s => s.deleteComment);

    const [open, setOpen] = useState(initialOpen);
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedComment, setSelectedComment] = useState(null);

    const comments = useMemo(() => {
        return (card?.comments || []).sort((a, b) =>
            new Date(a.createdAt) - new Date(b.createdAt)
        );
    }, [card?.comments]);

    const handleSubmit = async () => {
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            await createComment(card.columnId, card.id, { content: newComment });
            setNewComment('');
            toast.success('Comment added');
        } catch (err) {
            console.error('Failed to add comment:', err);
            toast.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async (commentId) => {
        if (!editContent.trim()) return;

        setSubmitting(true);
        try {
            await updateComment(card.columnId, card.id, commentId, { content: editContent });
            setEditingCommentId(null);
            setEditContent('');
            toast.success('Comment updated');
        } catch (err) {
            console.error('Failed to update comment:', err);
            toast.error('Failed to update comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;

        try {
            await deleteComment(card.columnId, card.id, commentId);
            toast.success('Comment deleted');
        } catch (err) {
            console.error('Failed to delete comment:', err);
            toast.error('Failed to delete comment');
        }
        setAnchorEl(null);
    };

    const handleMenuOpen = (event, comment) => {
        setAnchorEl(event.currentTarget);
        setSelectedComment(comment);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedComment(null);
    };

    const startEdit = (comment) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
        handleMenuClose();
    };

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CommentIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" fontWeight={600}>
                        Comments
                    </Typography>
                </Box>
                <IconButton
                    size="small"
                    onClick={() => setOpen(o => !o)}
                    aria-label={open ? 'Collapse comments' : 'Expand comments'}
                    sx={{
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                    }}
                >
                    <ExpandMoreIcon />
                </IconButton>
            </Box>
            <Collapse in={open}>
                <Paper sx={{ p: 2, mt: 2 }}>
                    <List sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                        {comments.map((comment) => (
                            <Box key={comment.id}>
                                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                    <ListItemAvatar>
                                        <Avatar src={comment.user?.avatar}>
                                            {comment.user?.userName?.[0]?.toUpperCase()}
                                        </Avatar>
                                    </ListItemAvatar>

                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle2">
                                                    {comment.user?.userName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            editingCommentId === comment.id ? (
                                                <Box sx={{ mt: 1 }}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        rows={2}
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        disabled={submitting}
                                                    />
                                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            onClick={() => handleEdit(comment.id)}
                                                            disabled={submitting}
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            onClick={() => {
                                                                setEditingCommentId(null);
                                                                setEditContent('');
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                                    {comment.content}
                                                </Typography>
                                            )
                                        }
                                    />

                                    {comment.userId === user?.id && editingCommentId !== comment.id && (
                                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, comment)}>
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </ListItem>
                                <Divider variant="inset" component="li" />
                            </Box>
                        ))}

                        {comments.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                No comments yet
                            </Typography>
                        )}
                    </List>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <Avatar src={user?.avatar} sx={{ width: 32, height: 32, mt: 1 }}>
                            {user?.userName?.[0]?.toUpperCase()}
                        </Avatar>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            disabled={submitting}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        />
                        <IconButton
                            color="primary"
                            onClick={handleSubmit}
                            disabled={!newComment.trim() || submitting}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>

                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                        <MenuItem onClick={() => startEdit(selectedComment)}>
                            <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
                        </MenuItem>
                        <MenuItem onClick={() => handleDelete(selectedComment?.id)}>
                            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
                        </MenuItem>
                    </Menu>
                </Paper>
            </Collapse>
        </>
    );
};

export default CommentSection;