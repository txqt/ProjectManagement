import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Checkbox,
  IconButton,
  LinearProgress,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';

const ChecklistItem = ({ 
  item, 
  onToggle, 
  onUpdate, 
  onDelete 
}) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);

  const handleUpdate = async () => {
    if (!title.trim()) return;
    
    try {
      await onUpdate(item.id, { title: title.trim() });
      setEditing(false);
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleUpdate();
    } else if (e.key === 'Escape') {
      setTitle(item.title);
      setEditing(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 0.5,
        '&:hover .item-actions': {
          opacity: 1,
        },
      }}
    >
      <Checkbox
        checked={item.isCompleted}
        onChange={() => onToggle(item.id)}
        icon={<CheckBoxOutlineBlankIcon />}
        checkedIcon={<CheckBoxIcon />}
        size="small"
      />

      {editing ? (
        <TextField
          fullWidth
          size="small"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleUpdate}
          autoFocus
        />
      ) : (
        <Typography
          sx={{
            flex: 1,
            textDecoration: item.isCompleted ? 'line-through' : 'none',
            color: item.isCompleted ? 'text.secondary' : 'text.primary',
            cursor: 'pointer',
          }}
          onClick={() => setEditing(true)}
        >
          {item.title}
        </Typography>
      )}

      <Box
        className="item-actions"
        sx={{
          display: 'flex',
          gap: 0.5,
          opacity: 0,
          transition: 'opacity 0.2s',
        }}
      >
        <IconButton
          size="small"
          onClick={() => setEditing(true)}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onDelete(item.id)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChecklistItem;