import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Column from './Column/Column';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import {
  SortableContext,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { TextField } from '@mui/material';
import { toast } from 'react-toastify';
import { useMemo } from 'react';

function ListColumns({ columns, createColumn, ...props }) {
  const { updateColumn, createCard, updateCard, deleteColumn, deleteCard, pendingTempIds, assignCardMember, unassignCardMember } = props;
  const [openNewColumnForm, setOpenNewColumnForm] = useState(false);
  const toggleOpenNewColumnForm = () => setOpenNewColumnForm(!openNewColumnForm);

  const [newColumnTitle, setNewColumnTitle] = useState('');

  const columnsId = useMemo(() => {
    return columns?.map((c) => c.id);
  }, [columns]);

  const addNewColumn = async () => {
    if (!newColumnTitle) {
      toast.error('Please enter Column Title');
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
      toast.error(err?.message || 'Có lỗi xảy ra');
    }
  }

  /**
   * Thằng Sortable yêu cầu items là một mảng dạng ['id-1', 'id-2'] chứ không phải [{id: 'id-1'}, {id: 'id-2'}]
   * Nếu không đúng thì vẫn kéo thả được nhưng không có animation
   * https://github.com/clauderic/dnd-kit/issues/183#issuecomment-812569512
   */
  return (
    <SortableContext
      items={columnsId}
      strategy={horizontalListSortingStrategy}
    >
      <Box
        sx={{
          bgcolor: 'inherit',
          width: '100%',
          height: '100%',
          display: 'flex',
          overflowX: 'auto',
          overflowY: 'hidden',
          '&::-webkit-scrollbar-track': { m: 2 }
        }}
      >
        {columns?.map((column) => {
          const isColumnPending = pendingTempIds?.has?.(column.id) ?? false;

          return (
            <div
              key={column.id}
              style={{
                opacity: isColumnPending ? 0.5 : 1,
                pointerEvents: isColumnPending ? 'none' : 'auto',
                transition: 'opacity 0.2s ease'
              }}
            >
              <Column
                column={column}
                createCard={createCard}
                updateCard={updateCard}
                updateColumn={updateColumn}
                deleteColumn={deleteColumn}
                deleteCard={deleteCard}
                pendingTempIds={pendingTempIds}
                assignCardMember={assignCardMember}
                unassignCardMember={unassignCardMember}
              />
            </div>
          );
        })}

        {/* Box Add new column CTA */}
        {!openNewColumnForm ? (
          <Box
            onClick={toggleOpenNewColumnForm}
            sx={{
              minWidth: '250px',
              maxWidth: '250px',
              mx: 2,
              borderRadius: '6px',
              height: 'fit-content',
              bgcolor: '#ffffff3d'
            }}
          >
            <Button
              startIcon={<NoteAddIcon />}
              sx={{
                color: 'white',
                width: '100%',
                justifyContent: 'flex-start',
                pl: 2.5,
                py: 1
              }}
            >
              Add new column
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              minWidth: '250px',
              maxWidth: '250px',
              mx: 2,
              p: 1,
              borderRadius: '6px',
              height: 'fit-content',
              bgcolor: '#ffffff3d',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            <TextField
              label='Enter column title...'
              type='text'
              size='small'
              variant='outlined'
              autoFocus
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              sx={{
                '& label': { color: 'white' },
                '& input': { color: 'white' },
                '& label.Mui-focused': { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'white' },
                  '&:hover fieldset': { borderColor: 'white' },
                  '&.Mui-focused fieldset': { borderColor: 'white' }
                }
              }}
            />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Button
                onClick={addNewColumn}
                variant='contained'
                color='success'
                size='small'
                sx={{
                  boxShadow: 'none',
                  border: '0.5px solid',
                  borderColor: (theme) => theme.palette.success.main,
                  '&:hover': { bgcolor: (theme) => theme.palette.success.main }
                }}
              >
                Add Column
              </Button>
              <CloseIcon
                fontSize='small'
                sx={{
                  color: 'white',
                  cursor: 'pointer',
                  '&:hover': { color: (theme) => theme.palette.warning.light }
                }}
                onClick={toggleOpenNewColumnForm}
              />
            </Box>
          </Box>
        )}
      </Box>
    </SortableContext>
  )
}

export default ListColumns