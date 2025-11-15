import AddIcon from '@mui/icons-material/Add';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';
import { toast } from 'react-toastify';
import ChecklistItem from './ChecklistItem';
import { useBoardStore } from '~/stores/boardStore';

const ChecklistSection = ({
  card
}) => {
  const [addingChecklist, setAddingChecklist] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [editingChecklistId, setEditingChecklistId] = useState(null);
  const [editChecklistTitle, setEditChecklistTitle] = useState('');
  const [addingItemToChecklist, setAddingItemToChecklist] = useState(null);
  const [newItemTitle, setNewItemTitle] = useState('');

  const createChecklist = useBoardStore((s) => s.createChecklist);
  const updateChecklist = useBoardStore((s) => s.updateChecklist);
  const deleteChecklist = useBoardStore((s) => s.deleteChecklist);
  const createChecklistItem = useBoardStore((s) => s.createChecklistItem);
  const updateChecklistItem = useBoardStore((s) => s.updateChecklistItem);
  const toggleChecklistItem = useBoardStore((s) => s.toggleChecklistItem);
  const deleteChecklistItem = useBoardStore((s) => s.deleteChecklistItem);

  const handleUpdateChecklistItem = async (itemId, data) => {
    if (!card) return;

    // Find checklist that contains this item
    const checklist = card.checklists?.find(cl =>
      cl.items?.some(item => item.id === itemId)
    );

    if (!checklist) return;

    await updateChecklistItem(card.columnId, card.id, checklist.id, itemId, data);
  };

  const handleToggleChecklistItem = async (itemId) => {
    if (!card) return;

    // Find checklist that contains this item
    const checklist = card.checklists?.find(cl =>
      cl.items?.some(item => item.id === itemId)
    );

    if (!checklist) return;

    await toggleChecklistItem(card.columnId, card.id, checklist.id, itemId);
  };

  const handleDeleteChecklistItem = async (itemId) => {
    if (!card) return;

    // Find checklist that contains this item
    const checklist = card.checklists?.find(cl =>
      cl.items?.some(item => item.id === itemId)
    );

    if (!checklist) return;

    if (!window.confirm('Delete this item?')) return;

    await deleteChecklistItem(card.columnId, card.id, checklist.id, itemId);
  };

  const handleCreateChecklist = async () => {
    if (!newChecklistTitle.trim()) {
      toast.error('Checklist title is required');
      return;
    }

    try {
      await createChecklist(card.columnId, card.id, { title: newChecklistTitle.trim() });
      setNewChecklistTitle('');
      setAddingChecklist(false);
      toast.success('Checklist created');
    } catch (err) {
      console.error('Failed to create checklist:', err);
      toast.error('Failed to create checklist');
    }
  };

  const handleUpdateChecklist = async (checklistId) => {
    if (!editChecklistTitle.trim()) return;

    try {
      await updateChecklist(card.columnId, card.id, checklistId, { title: editChecklistTitle.trim() });
      setEditingChecklistId(null);
      setEditChecklistTitle('');
      toast.success('Checklist updated');
    } catch (err) {
      console.error('Failed to update checklist:', err);
      toast.error('Failed to update checklist');
    }
  };

  const handleDeleteChecklist = async (checklistId) => {
    if (!window.confirm('Delete this checklist?')) return;

    try {
      await deleteChecklist(card.columnId, card.id, checklistId);
      toast.success('Checklist deleted');
    } catch (err) {
      console.error('Failed to delete checklist:', err);
      toast.error('Failed to delete checklist');
    }
  };

  const handleCreateItem = async (checklistId) => {
    if (!newItemTitle.trim()) {
      toast.error('Item title is required');
      return;
    }

    try {
      await createChecklistItem(card.columnId, card.id, checklistId, { title: newItemTitle.trim() });
      setNewItemTitle('');
      setAddingItemToChecklist(null);
      toast.success('Item added');
    } catch (err) {
      console.error('Failed to create item:', err);
      toast.error('Failed to create item');
    }
  };

  const calculateProgress = (checklist) => {
    const items = checklist.items || [];
    if (items.length === 0) return 0;
    const completed = items.filter(i => i.isCompleted).length;
    return Math.round((completed / items.length) * 100);
  };

  const startEditChecklist = (checklist) => {
    setEditingChecklistId(checklist.id);
    setEditChecklistTitle(checklist.title);
    setAddingChecklist(false);
    setAddingItemToChecklist(null);
  };

  const cancelEditChecklist = () => {
    setEditingChecklistId(null);
    setEditChecklistTitle('');
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ mb: 1 }}>
        {/* Existing Checklists */}
        {card.checklists?.map((checklist) => {
          const progress = calculateProgress(checklist);
          const items = checklist.items || [];

          return (
            <Box key={checklist.id} sx={{ mb: 3 }}>
              {/* Checklist Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckBoxIcon sx={{ color: 'text.secondary' }} />

                {editingChecklistId === checklist.id ? (
                  <TextField
                    size="small"
                    value={editChecklistTitle}
                    onChange={(e) => setEditChecklistTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateChecklist(checklist.id);
                      if (e.key === 'Escape') cancelEditChecklist();
                    }}
                    onBlur={() => handleUpdateChecklist(checklist.id)}
                    autoFocus
                    sx={{ flex: 1 }}
                  />
                ) : (
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ flex: 1, cursor: 'pointer' }}
                    onClick={() => startEditChecklist(checklist)}
                  >
                    {checklist.title}
                  </Typography>
                )}

                <Typography variant="caption" color="text.secondary">
                  {progress}%
                </Typography>

                <IconButton
                  size="small"
                  onClick={() => handleDeleteChecklist(checklist.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Progress Bar */}
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ mb: 2, height: 8, borderRadius: 1 }}
              />

              {/* Checklist Items */}
              <Box sx={{ pl: 4 }}>
                {items.map((item) => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    onToggle={handleToggleChecklistItem}
                    onUpdate={handleUpdateChecklistItem}
                    onDelete={handleDeleteChecklistItem}
                  />
                ))}

                {/* Add Item */}
                {addingItemToChecklist === checklist.id ? (
                  <Box sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add an item"
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateItem(checklist.id);
                        if (e.key === 'Escape') {
                          setAddingItemToChecklist(null);
                          setNewItemTitle('');
                        }
                      }}
                      autoFocus
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleCreateItem(checklist.id)}
                      >
                        Add
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setAddingItemToChecklist(null);
                          setNewItemTitle('');
                        }}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setAddingItemToChecklist(checklist.id)}
                    sx={{ mt: 1 }}
                  >
                    Add an item
                  </Button>
                )}
              </Box>
            </Box>
          );
        })}

        {/* Add New Checklist */}
        {addingChecklist ? (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Checklist Title"
              value={newChecklistTitle}
              onChange={(e) => setNewChecklistTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateChecklist();
                if (e.key === 'Escape') {
                  setAddingChecklist(false);
                  setNewChecklistTitle('');
                }
              }}
              autoFocus
            />
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="contained"
                onClick={handleCreateChecklist}
              >
                Add
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setAddingChecklist(false);
                  setNewChecklistTitle('');
                }}
              >
                Cancel
              </Button>
            </Stack>
          </Box>
        ) : (
          <Button
            fullWidth
            startIcon={<CheckBoxIcon />}
            onClick={() => setAddingChecklist(true)}
            sx={{
              justifyContent: 'flex-start',
              py: 1,
              px: 2,
              color: 'text.secondary',
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            Add Checklist
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default ChecklistSection;