import React, { useState, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
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
  Delete as DeleteIcon,
  Edit as EditIcon,
  AttachFile as AttachFileIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import { useBoardStore } from '~/stores/boardStore';

const AttachmentSection = ({ card, initialOpen = true }) => {
  const createAttachment = useBoardStore(s => s.createAttachment);
  const deleteAttachment = useBoardStore(s => s.deleteAttachment);

  const [open, setOpen] = useState(initialOpen);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentType, setAttachmentType] = useState('file');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachMenuAnchor, setAttachMenuAnchor] = useState(null);
  const fileInputRef = useRef(null);

  const attachments = useMemo(() => {
    return (card?.attachments || []).sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [card?.attachments]);

  const linkAttachments = useMemo(() => attachments.filter(a => (a.type || '').toLowerCase() === 'link'), [attachments]);
  const fileAttachments = useMemo(() => attachments.filter(a => (a.type || '').toLowerCase() !== 'link'), [attachments]);

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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      await useBoardStore.getState().uploadAttachment(card.columnId, card.id, file);
      toast.success('Attachment uploaded');
    } catch (err) {
      console.error('Failed to upload attachment:', err);
      toast.error('Failed to upload attachment');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1">
          Attachments ({attachments.length})
        </Typography>
        <Box>
          <Button
            size="small"
            startIcon={<AttachFileIcon />}
            onClick={(e) => setAttachMenuAnchor(e.currentTarget)}
            disabled={uploadingFile}
            sx={{ mr: 1 }}
          >
            Add / Upload
          </Button>
          <IconButton
            size="small"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Collapse attachments' : 'Expand attachments'}
            sx={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </Box>

      <Collapse in={open}>
        <Box sx={{ mb: 2 }}>
          <Menu
            anchorEl={attachMenuAnchor}
            open={Boolean(attachMenuAnchor)}
            onClose={() => setAttachMenuAnchor(null)}
          >
            <MenuItem onClick={() => {
              setAttachMenuAnchor(null);
              setShowForm(false);
              fileInputRef.current?.click();
            }}>
              <FileIcon fontSize="small" sx={{ mr: 1 }} /> Upload
            </MenuItem>
            <MenuItem onClick={() => { setAttachMenuAnchor(null); setShowForm(prev => !prev); setAttachmentType('link'); }}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} /> Add
            </MenuItem>
          </Menu>
          <input ref={fileInputRef} hidden type="file" onChange={handleFileChange} />
        </Box>

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

        {linkAttachments.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Links ({linkAttachments.length})</Typography>

            <List dense>
              {linkAttachments.map(a => (
                <ListItem key={a.id} secondaryAction={
                  <IconButton edge="end" onClick={() => handleDelete(a.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }>
                  <ListItemText
                    primary={<a href={a.url} target="_blank" rel="noopener noreferrer">{a.name}</a>}
                    secondary={formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {fileAttachments.length > 0 && (
          <Box>
            <Typography variant="subtitle2">Files ({fileAttachments.length})</Typography>

            <List dense>
              {fileAttachments.map((attachment) => (
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
            </List>
          </Box>
        )}
      </Collapse>
    </Paper>
  );
};

export default AttachmentSection;