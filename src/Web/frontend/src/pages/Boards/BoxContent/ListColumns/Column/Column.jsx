import {
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import AddCardIcon from '@mui/icons-material/AddCard';
import CloseIcon from '@mui/icons-material/Close';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { memo, useEffect, useRef, useState } from 'react';
import Card from './ListCards/Card/Card';



const Column = memo(({ column, createCard, deleteColumn, deleteCard, pendingTempIds, onReorderCards, onMoveCard }) => {
  const columnRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openNewCardForm, setOpenNewCardForm] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const open = Boolean(anchorEl);
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const toggleOpenNewCardForm = () => setOpenNewCardForm(!openNewCardForm);

  useEffect(() => {
    const el = columnRef.current;
    if (!el) return;

    return combine(
      draggable({
        element: el,
        getInitialData: () => ({ 
          type: 'column', 
          columnId: column.id 
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element: el,
        getData: ({ input, element }) => {
          const data = { type: 'column', columnId: column.id };
          return attachClosestEdge(data, {
            input,
            element,
            allowedEdges: ['left', 'right'],
          });
        },
        canDrop: ({ source }) => {
          if (source.data.type === 'column') {
            return source.data.columnId !== column.id;
          }
          // Allow cards to be dropped on column
          return source.data.type === 'card';
        },
        onDrag: ({ self, source }) => {
          if (source.data.type === 'column') {
            const edge = extractClosestEdge(self.data);
            setClosestEdge(edge);
          }
        },
        onDragLeave: () => setClosestEdge(null),
        onDrop: ({ source }) => {
          setClosestEdge(null);
          
          // Handle card drop on empty column or between cards
          if (source.data.type === 'card') {
            const sourceColumnId = source.data.columnId;
            const targetColumnId = column.id;
            const cardId = source.data.cardId;
            
            if (sourceColumnId !== targetColumnId) {
              // Move to different column - append to end
              onMoveCard?.(cardId, sourceColumnId, targetColumnId, column.cards?.length || 0);
            }
          }
        },
      })
    );
  }, [column.id, column.cards?.length, onMoveCard]);

  const addNewCard = async () => {
    if (!newCardTitle) {
      alert('Please enter Card Title');
      return;
    }
    try {
      await createCard(column.id, {
        title: newCardTitle,
        description: 'Description',
      });
      toggleOpenNewCardForm();
      setNewCardTitle('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {closestEdge === 'left' && (
        <Box sx={{ 
          position: 'absolute', 
          left: -2, 
          top: 0, 
          bottom: 0, 
          width: 2, 
          bgcolor: '#1976d2',
          zIndex: 1
        }} />
      )}

      <Box
        ref={columnRef}
        sx={{
          minWidth: '300px',
          maxWidth: '300px',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? '#333643' : '#ebecf0',
          borderRadius: '6px',
          height: 'fit-content',
          maxHeight: 'calc(100vh - 200px)',
          opacity: isDragging ? 0.5 : 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Column Header */}
        <Box sx={{ 
          height: '50px', 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <Typography variant='h6' sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
            {column?.title}
          </Typography>
          <Box>
            <Tooltip title='More options'>
              <ExpandMoreIcon
                sx={{ color: 'text.primary', cursor: 'pointer' }}
                onClick={handleClick}
              />
            </Tooltip>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
              <MenuItem onClick={() => deleteColumn(column.id)}>
                <ListItemIcon>
                  <DeleteForeverIcon fontSize='small' />
                </ListItemIcon>
                <ListItemText>Delete this column</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Cards List */}
        <Box sx={{ 
          p: '0 5px 5px 5px',
          m: '0 5px',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          overflowY: 'auto',
          flex: 1,
          minHeight: '50px'
        }}>
          {column?.cards?.map((card) => {
            const isCardPending = pendingTempIds?.has?.(card.id) ?? false;
            return (
              <div key={card.id} style={{ 
                opacity: isCardPending ? 0.5 : 1,
                pointerEvents: isCardPending ? 'none' : 'auto',
              }}>
                <Card card={card} columnId={column.id} />
              </div>
            );
          })}
        </Box>

        {/* Column Footer */}
        <Box sx={{ height: '50px', p: 2 }}>
          {!openNewCardForm ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Button startIcon={<AddCardIcon />} onClick={toggleOpenNewCardForm}>
                Add new card
              </Button>
              <Tooltip title='Drag to move'>
                <DragHandleIcon sx={{ cursor: 'pointer' }} />
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label='Enter card title...'
                size='small'
                autoFocus
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addNewCard()}
                sx={{ flex: 1 }}
              />
              <Button onClick={addNewCard} variant='contained' color='success' size='small'>
                Add
              </Button>
              <CloseIcon fontSize='small' sx={{ cursor: 'pointer' }} onClick={toggleOpenNewCardForm} />
            </Box>
          )}
        </Box>
      </Box>

      {closestEdge === 'right' && (
        <Box sx={{ 
          position: 'absolute', 
          right: -2, 
          top: 0, 
          bottom: 0, 
          width: 2, 
          bgcolor: '#1976d2',
          zIndex: 1
        }} />
      )}
    </Box>
  );
});

export default Column