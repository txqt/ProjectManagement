import { useState, useMemo } from 'react';
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
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Send as SendIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AttachFile as AttachFileIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import { useBoardStore } from '~/stores/boardStore';
import { useAuth } from '~/hooks/useAuth';

const CommentSection = ({ card }) => {
  const { user } = useAuth();
  const createComment = useBoardStore(s => s.createComment);
  const updateComment = useBoardStore(s => s.updateComment);
  const deleteComment = useBoardStore(s => s.deleteComment);

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
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Comments ({comments.length})
      </Typography>

      {/* Comment List */}
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

      {/* Comment Input */}
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

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => startEdit(selectedComment)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => handleDelete(selectedComment?.id)}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Paper>
  );
};

const AttachmentSection = ({ card }) => {
  const createAttachment = useBoardStore(s => s.createAttachment);
  const deleteAttachment = useBoardStore(s => s.deleteAttachment);

  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentType, setAttachmentType] = useState('file');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const attachments = useMemo(() => {
    return (card?.attachments || []).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [card?.attachments]);

  const handleSubmit = async () => {
    if (!attachmentName.trim() || !attachmentUrl.trim()) {
      toast.error('Name and URL are required');
      return;
    }

    setSubmitting(true);
    try {
      await createAttachment(card.columnId, card.id, {
        name: attachmentName,
        url: attachmentUrl,
        type: attachmentType
      });
      setAttachmentName('');
      setAttachmentUrl('');
      setAttachmentType('file');
      setShowForm(false);
      toast.success('Attachment added');
    } catch (err) {
      console.error('Failed to add attachment:', err);
      toast.error('Failed to add attachment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (attachmentId) => {
    if (!window.confirm('Delete this attachment?')) return;

    try {
      await deleteAttachment(card.columnId, card.id, attachmentId);
      toast.success('Attachment deleted');
    } catch (err) {
      console.error('Failed to delete attachment:', err);
      toast.error('Failed to delete attachment');
    }
  };

  const getIcon = (type) => {
    if (type === 'image') return <ImageIcon />;
    return <FileIcon />;
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1">
          Attachments ({attachments.length})
        </Typography>
        <Button
          size="small"
          startIcon={<AttachFileIcon />}
          onClick={() => setShowForm(!showForm)}
        >
          Add
        </Button>
      </Box>

      {/* Add Attachment Form */}
      {showForm && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <TextField
            fullWidth
            size="small"
            label="Name"
            value={attachmentName}
            onChange={(e) => setAttachmentName(e.target.value)}
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            size="small"
            label="URL"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
            >
              Add
            </Button>
            <Button size="small" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {/* Attachment List */}
      <List dense>
        {attachments.map((attachment) => (
          <ListItem
            key={attachment.id}
            secondaryAction={
              <IconButton edge="end" onClick={() => handleDelete(attachment.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemAvatar>{getIcon(attachment.type)}</ListItemAvatar>
            <ListItemText
              primary={
                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                  {attachment.name}
                </a>
              }
              secondary={formatDistanceToNow(new Date(attachment.createdAt), { addSuffix: true })}
            />
          </ListItem>
        ))}

        {attachments.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No attachments
          </Typography>
        )}
      </List>
    </Paper>
  );
};

// Export both components
export { CommentSection, AttachmentSection };