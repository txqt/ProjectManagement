// ===== FILE: ListColumns.jsx (OPTIMIZED) =====
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CloseIcon from '@mui/icons-material/Close';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { TextField } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useMemo, useState, useCallback, memo } from 'react';
import { toast } from 'react-toastify';
import Column from './Column/Column';

function ListColumns({ ...props }) {
  const [openNewColumnForm, setOpenNewColumnForm] = useState(false);
  const toggleOpenNewColumnForm = useCallback(() => setOpenNewColumnForm(prev => !prev), []);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const columnsId = useMemo(() => {
    return props.columns?.map((c) => c.id);
  }, [props.columns]);

  const addNewColumn = useCallback(async () => {
    if (!newColumnTitle) {
      toast.error('Please enter Column Title');
      return;
    }

    try {
      await props.createColumn({
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
  }, [newColumnTitle, props.createColumn, toggleOpenNewColumnForm])

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
        {props.columns?.map((column) => {
          const isColumnPending = props.pendingTempIds?.has?.(column.id) ?? false;

          return (
            <SortableColumnWrapper
              key={column.id}
              column={column}
              isColumnPending={isColumnPending}
              createColumn={props.createColumn}
              updateCard={props.updateCard}
              updateColumn={props.updateColumn}
              createCard={props.createCard}
              deleteColumn={props.deleteColumn}
              deleteCard={props.deleteCard}
              pendingTempIds={props.pendingTempIds}
              assignCardMember={props.assignCardMember}
              unassignCardMember={props.unassignCardMember}
            />
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

// OPTIMIZATION KEY: Tách sortable logic ra component riêng
// Chỉ wrapper này re-render khi drag, Column bên trong KHÔNG re-render
const SortableColumnWrapper = memo(function SortableColumnWrapper(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: props.column.id,
    data: { ...props.column, __type: 'COLUMN' }
  })

  // OPTIMIZATION: Chỉ apply transform lên wrapper div
  // Column component bên trong KHÔNG nhận transform props
  const dndKitColumnStyles = {
    transform: CSS.Translate.toString(transform),
    transition,
    height: '100%',
    opacity: props.isColumnPending ? 0.5 : (isDragging ? 0.5 : 1),
    pointerEvents: props.isColumnPending ? 'none' : 'auto'
  }

  const dragHandleProps = { ...attributes, ...listeners, 'data-dnd-handle': true };

  return (
    <div ref={setNodeRef} style={dndKitColumnStyles}>
      <Column
        dragHandleProps={dragHandleProps}
        column={props.column}
        createCard={props.createCard}
        updateCard={props.updateCard}
        updateColumn={props.updateColumn}
        deleteColumn={props.deleteColumn}
        deleteCard={props.deleteCard}
        pendingTempIds={props.pendingTempIds}
        assignCardMember={props.assignCardMember}
        unassignCardMember={props.unassignCardMember}
      />
    </div>
  )
}, (prevProps, nextProps) => {
  // OPTIMIZATION: Wrapper chỉ re-render khi drag state hoặc pending thay đổi
  // Column content comparison được handle bởi Column component
  
  if (prevProps.column?.id !== nextProps.column?.id) return false
  if (prevProps.isColumnPending !== nextProps.isColumnPending) return false
  
  // IMPORTANT: PHẢI pass through column changes để Column component nhận được update
  // Chỉ block re-render nếu column object hoàn toàn giống nhau (reference equality)
  if (prevProps.column !== nextProps.column) return false
  
  return true
})

export default ListColumns