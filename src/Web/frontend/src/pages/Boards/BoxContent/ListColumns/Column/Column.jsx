// ===== FILE: Column.jsx (OPTIMIZED) =====
import AddCardIcon from '@mui/icons-material/AddCard'
import CloseIcon from '@mui/icons-material/Close'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import DragHandleIcon from '@mui/icons-material/DragHandle'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { TextField, Box, Button, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip, Typography } from '@mui/material'
import { memo, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { sortCardsByRank } from '~/utils/sorts'
import ListCards from './ListCards/ListCards'
import ConditionalRender from '~/components/ConditionalRender/ConditionalRender'

// OPTIMIZATION: Memoize với custom comparison
const Column = memo(({ dragHandleProps, column, ...props }) => {
  const orderedCards = sortCardsByRank(column?.cards)

  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)
  const handleClick = useCallback((event) => setAnchorEl(event.currentTarget), [])
  const handleClose = useCallback(() => setAnchorEl(null), [])

  const [openNewCardForm, setOpenNewCardForm] = useState(false)
  const toggleOpenNewCardForm = useCallback(() => setOpenNewCardForm(prev => !prev), [])
  const [newCardTitle, setNewCardTitle] = useState('')
  const [editMode, setEditMode] = useState(false)

  const addNewCard = useCallback(async () => {
    if (!newCardTitle) {
      toast.error('Please enter Card Title', { position: 'bottom-right' })
      return
    }
    try {
      await props.createCard(column.id, {
        title: newCardTitle,
        description: 'Description'
      })
      toggleOpenNewCardForm()
      setNewCardTitle('')
    } catch (err) {
      console.error(err)
    }
  }, [newCardTitle, props.createCard, column.id, toggleOpenNewCardForm])

  const handleUpdateColumn = useCallback(async (newTitle) => {
    await props.updateColumn(column.id, { title: newTitle })
    setEditMode(false)
  }, [props.updateColumn, column.id])

  const handleDeleteColumn = useCallback(() => {
    props.deleteColumn(column.id)
  }, [props.deleteColumn, column.id])

  return (
    <Box
      sx={{
        minWidth: '300px',
        maxWidth: '300px',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? '#333643' : '#ebecf0',
        ml: 2,
        borderRadius: '6px',
        height: 'fit-content',
        maxHeight: (theme) =>
          `calc(${theme.custom.boardContentHeight} - ${theme.spacing(5)})`
      }}
    >
      {/* Header */}
      <Box
        {...dragHandleProps}
        sx={{
          height: (theme) => theme.custom.columnHeaderHeight,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {editMode ? (
          <TextField
            autoFocus
            variant="outlined"
            defaultValue={column?.title}
            onKeyDown={async (e) => {
              if (e.key !== 'Enter') return
              await handleUpdateColumn(e.target.value)
            }}
            onBlur={() => setEditMode(false)}
            slotProps={{
              input: {
                sx: {
                  height: 28,
                  padding: '0 8px',
                  fontWeight: 'bold'
                }
              }
            }}
          />
        ) : (
          <Typography
            variant="h6"
            onClick={() => setEditMode(true)}
            sx={{ fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {column?.title}
          </Typography>
        )}

        {/* Dropdown */}
        <Box>
          <Tooltip title="More options">
            <ExpandMoreIcon
              sx={{ color: 'text.primary', cursor: 'pointer' }}
              id="basic-column-dropdown"
              aria-controls={open ? 'basic-menu-column-dropdown' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleClick}
            />
          </Tooltip>
          <Menu
            id="basic-menu-column-dropdown"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
          >
            <ConditionalRender permission="boards.delete">
              <MenuItem onClick={handleDeleteColumn}>
                <ListItemIcon>
                  <DeleteForeverIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>
                  Delete this column (cannot undo this action)
                </ListItemText>
              </MenuItem>
            </ConditionalRender>
          </Menu>
        </Box>
      </Box>

      {/* Cards - OPTIMIZATION: Pass stable props */}
      <ListCards
        cards={orderedCards}
        columnId={column.id}
        createCard={props.createCard}
        updateCard={props.updateCard}
        deleteCard={props.deleteCard}
        pendingTempIds={props.pendingTempIds}
        assignCardMember={props.assignCardMember}
        unassignCardMember={props.unassignCardMember}
      />

      {/* Footer */}
      <Box sx={{ height: (theme) => theme.custom.columnFooterHeight, p: 2 }}>
        {!openNewCardForm ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button
              startIcon={<AddCardIcon />}
              onClick={toggleOpenNewCardForm}
              sx={{
                width: '100%',
                justifyContent: 'flex-start'
              }}>
              Add new card
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="Enter card title..."
              type="text"
              size="small"
              variant="outlined"
              autoFocus
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              sx={{
                '& input': {
                  color: (theme) => theme.palette.primary.main,
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? '#333643' : 'white'
                }
              }}
            />
            <Button onClick={addNewCard} variant="contained" color="success" size="small">
              Add
            </Button>
            <CloseIcon
              fontSize="small"
              sx={{
                color: (theme) => theme.palette.warning.light,
                cursor: 'pointer'
              }}
              onClick={toggleOpenNewCardForm}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}, (prevProps, nextProps) => {
  // OPTIMIZATION: Custom comparison để tránh re-render không cần thiết
  // IMPORTANT: Phải cho phép re-render khi cards thay đổi order hoặc content
  
  // So sánh column basic info
  if (prevProps.column?.id !== nextProps.column?.id) return false
  if (prevProps.column?.title !== nextProps.column?.title) return false
  if (prevProps.column?.rank !== nextProps.column?.rank) return false
  
  // So sánh cards - CRITICAL: phải check cả order và content
  const prevCards = prevProps.column?.cards || []
  const nextCards = nextProps.column?.cards || []
  
  if (prevCards.length !== nextCards.length) return false
  
  // Check order và content của cards
  for (let i = 0; i < prevCards.length; i++) {
    // Check nếu ID thay đổi (order khác) hoặc rank thay đổi
    if (prevCards[i]?.id !== nextCards[i]?.id) return false
    if (prevCards[i]?.rank !== nextCards[i]?.rank) return false
  }
  
  // So sánh pendingTempIds
  if (prevProps.pendingTempIds !== nextProps.pendingTempIds) return false
  
  // Nếu tất cả đều giống nhau -> không cần re-render
  return true
})

Column.displayName = 'Column'

export default Column