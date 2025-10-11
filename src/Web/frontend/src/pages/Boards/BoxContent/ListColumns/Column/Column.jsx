import AddCardIcon from '@mui/icons-material/AddCard'
import CloseIcon from '@mui/icons-material/Close'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import DragHandleIcon from '@mui/icons-material/DragHandle'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { TextField, Box, Button, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip, Typography } from '@mui/material'
import { memo, useState } from 'react'
import { toast } from 'react-toastify'
import { mapOrder } from '~/utils/sorts'
import ListCards from './ListCards/ListCards'
import ConditionalRender from '~/components/ConditionalRender/ConditionalRender'

const Column = memo(({ dragHandleProps, ...props }) => {
  const orderedCards = mapOrder(props.column?.cards, props.column?.cardOrderIds, 'id')

  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)
  const handleClick = (event) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const [openNewCardForm, setOpenNewCardForm] = useState(false)
  const toggleOpenNewCardForm = () => setOpenNewCardForm(!openNewCardForm)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [editMode, setEditMode] = useState(false)

  const addNewCard = async () => {
    if (!newCardTitle) {
      toast.error('Please enter Card Title', { position: 'bottom-right' })
      return
    }
    try {
      await props.createCard(props.column.id, {
        title: newCardTitle,
        description: 'Description'
      })
      toggleOpenNewCardForm()
      setNewCardTitle('')
    } catch (err) {
      console.error(err)
    }
  }

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
            defaultValue={props.column?.title}
            onKeyDown={async (e) => {
              if (e.key !== 'Enter') return
              await props.updateColumn(props.column.id, { title: e.target.value })
              setEditMode(false)
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
            {props.column?.title}
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
              <MenuItem onClick={() => props.deleteColumn(props.column.id)}>
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

      {/* Cards */}
      <ListCards
        cards={orderedCards}
        {...props}
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
});

export default Column;