import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';
import { toast } from 'react-toastify';

const COLOR_PALETTE = [
  '#61bd4f', // green
  '#f2d600', // yellow
  '#ff9f1a', // orange
  '#eb5a46', // red
  '#c377e0', // purple
  '#0079bf', // blue
  '#00c2e0', // sky
  '#51e898', // lime
  '#ff78cb', // pink
  '#344563', // black
];

const LabelSelector = ({ 
  open, 
  onClose, 
  labels, 
  selectedLabels = [],
  onToggleLabel,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel
}) => {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [newLabelTitle, setNewLabelTitle] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(COLOR_PALETTE[0]);

  const handleCreate = async () => {
    if (!newLabelTitle.trim()) {
      toast.error('Label title is required');
      return;
    }

    try {
      await onCreateLabel({
        title: newLabelTitle.trim(),
        color: newLabelColor,
      });
      setNewLabelTitle('');
      setNewLabelColor(COLOR_PALETTE[0]);
      setCreating(false);
      toast.success('Label created');
    } catch (err) {
      console.error('Failed to create label:', err);
      toast.error('Failed to create label');
    }
  };

  const handleUpdate = async () => {
    if (!editing || !newLabelTitle.trim()) return;

    try {
      await onUpdateLabel(editing.id, {
        title: newLabelTitle.trim(),
        color: newLabelColor,
      });
      setEditing(null);
      setNewLabelTitle('');
      setNewLabelColor(COLOR_PALETTE[0]);
      toast.success('Label updated');
    } catch (err) {
      console.error('Failed to update label:', err);
      toast.error('Failed to update label');
    }
  };

  const handleDelete = async (labelId) => {
    if (!window.confirm('Delete this label? It will be removed from all cards.')) return;

    try {
      await onDeleteLabel(labelId);
      toast.success('Label deleted');
    } catch (err) {
      console.error('Failed to delete label:', err);
      toast.error('Failed to delete label');
    }
  };

  const startEdit = (label) => {
    setEditing(label);
    setNewLabelTitle(label.title);
    setNewLabelColor(label.color);
    setCreating(false);
  };

  const cancelEdit = () => {
    setEditing(null);
    setCreating(false);
    setNewLabelTitle('');
    setNewLabelColor(COLOR_PALETTE[0]);
  };

  const isSelected = (labelId) => selectedLabels.some(l => l.id === labelId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Labels</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <List sx={{ py: 0 }}>
          {labels.map((label) => (
            <ListItem
              key={label.id}
              disablePadding
              secondaryAction={
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => startEdit(label)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(label.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              }
            >
              <ListItemButton onClick={() => onToggleLabel(label)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  {isSelected(label.id) && (
                    <CheckIcon fontSize="small" color="primary" />
                  )}
                  <Chip
                    label={label.title}
                    size="small"
                    sx={{
                      bgcolor: label.color,
                      color: '#fff',
                      fontWeight: 500,
                      minWidth: 100,
                    }}
                  />
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* Create/Edit Form */}
        {(creating || editing) && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              {editing ? 'Edit Label' : 'Create Label'}
            </Typography>

            <TextField
              fullWidth
              size="small"
              label="Title"
              value={newLabelTitle}
              onChange={(e) => setNewLabelTitle(e.target.value)}
              sx={{ mb: 2 }}
              autoFocus
            />

            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              Select Color
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {COLOR_PALETTE.map((color) => (
                <Box
                  key={color}
                  onClick={() => setNewLabelColor(color)}
                  sx={{
                    width: 40,
                    height: 32,
                    bgcolor: color,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: color === newLabelColor ? '3px solid' : '2px solid transparent',
                    borderColor: color === newLabelColor ? 'primary.main' : 'transparent',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                />
              ))}
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                size="small"
                onClick={editing ? handleUpdate : handleCreate}
              >
                {editing ? 'Update' : 'Create'}
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={cancelEdit}
              >
                Cancel
              </Button>
            </Stack>
          </Box>
        )}

        {/* Create Button */}
        {!creating && !editing && (
          <Button
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => setCreating(true)}
            sx={{ mt: 2 }}
          >
            Create New Label
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LabelSelector;