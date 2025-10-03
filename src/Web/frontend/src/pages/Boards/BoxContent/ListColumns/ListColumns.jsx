import React, { memo } from 'react';
import Box from '@mui/material/Box';
import Column from './Column/Column';
import { useState } from 'react';
import { Button } from '@mui/material';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
// ListColumns: wrapper that renders an array of Column components
// Place this file next to Column.jsx and import it from the parent (Board) component.

const ListColumns = ({
  columns = [],
  createCard,
  deleteColumn,
  deleteCard,
  pendingTempIds,
  onReorderCards,
  onMoveCard,
  onReorderColumns,
  createColumn
}) => {
  const [openNewColumnForm, setOpenNewColumnForm] = useState(false);
  const toggleOpenNewColumnForm = () => setOpenNewColumnForm(!openNewColumnForm);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const addNewColumn = async () => {
    if (!newColumnTitle) {
      alert('Please enter Column Title');
      return;
    }
    try {
      await createColumn({
        title: newColumnTitle,
        description: 'description',
        type: 'public'
      });
      toggleOpenNewColumnForm();
      setNewColumnTitle('');
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
          overflowX: 'auto',
          p: 1,
        }}
      >
        {columns?.map((column) => (
          <Column
            key={column.id}
            column={column}
            createCard={createCard}
            deleteColumn={deleteColumn}
            deleteCard={deleteCard}
            pendingTempIds={pendingTempIds}
            onReorderCards={onReorderCards}
            onMoveCard={onMoveCard}
            onReorderColumns={onReorderColumns}
          />
        ))}

        {/* Add New Column */}
        {!openNewColumnForm ? (
          <Box onClick={toggleOpenNewColumnForm} sx={{
            minWidth: '250px',
            borderRadius: '6px',
            height: 'fit-content',
            bgcolor: '#ffffff3d',
            cursor: 'pointer'
          }}>
            <Button startIcon={<NoteAddIcon />} sx={{
              color: 'white',
              width: '100%',
              justifyContent: 'flex-start',
              pl: 2.5,
              py: 1
            }}>
              Add new column
            </Button>
          </Box>
        ) : (
          <Box sx={{
            minWidth: '250px',
            p: 1,
            borderRadius: '6px',
            height: 'fit-content',
            bgcolor: '#ffffff3d',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            <TextField
              label='Enter column title...'
              size='small'
              autoFocus
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNewColumn()}
              sx={{
                '& label': { color: 'white' },
                '& input': { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'white' },
                }
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button onClick={addNewColumn} variant='contained' color='success' size='small'>
                Add Column
              </Button>
              <CloseIcon fontSize='small' sx={{ color: 'white', cursor: 'pointer' }} onClick={toggleOpenNewColumnForm} />
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
};

export default memo(ListColumns);