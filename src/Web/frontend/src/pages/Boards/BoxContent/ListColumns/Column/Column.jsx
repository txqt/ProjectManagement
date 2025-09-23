import React from 'react'
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { useState } from 'react'
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import ContentCut from '@mui/icons-material/ContentCut';
import Cloud from '@mui/icons-material/Cloud';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import IconButton from "@mui/material/IconButton";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddCardIcon from '@mui/icons-material/AddCard';
import { ContentCopy, ContentPaste } from "@mui/icons-material";
import DragHandleIcon from '@mui/icons-material/DragHandle';
import ListCards from './ListCards/ListCards';
import { sortByOrder } from '~/utils/sorts';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function Column({ column }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: column.id, data: { ...column } });

    const dndKitColumnStyle = {
        transform: CSS.Translate.toString(transform),
        transition,

        // The height must always be max 100%, otherwise when dragging a short column across a long column, 
        // you’ll have to drag through the middle area which is very inconvenient. 
        // Note: this must be combined with {...listeners} placed in the Box, not in the outer div, 
        // to avoid the case of dragging into the green area.
        height: '100%',
        opacity: isDragging ? 0.5 : undefined
    };

    const orderedCards = sortByOrder(column?.cards, column?.cardOrderIds, 'id');
    return (
        <div
            ref={setNodeRef}
            style={dndKitColumnStyle}
            {...attributes}
        >
            <Box
                {...listeners}
                sx={(theme) => ({
                    minWidth: '300px',
                    maxWidth: '300px',
                    bgcolor: theme.palette.mode === 'dark' ? '#333643' : '#ebecf0',
                    ml: 2,
                    borderRadius: '6px',
                    height: 'fit-content',
                    maxHeight: `calc(${theme.custom.boardContentHeight} - ${theme.spacing(5)})`
                })}>
                {/* Box Column Header */}
                <Box sx={(theme) => ({
                    height: theme.custom.columnHeaderHeight,
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                })}
                >
                    <Typography variant="h6" sx={{
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                    >
                        {column?.title}
                    </Typography>
                    <Box>
                        <Tooltip title="More options">
                            <IconButton
                                id="basic-column-dropdown"
                                aria-controls={open ? 'basic-menu-column-dropdown' : undefined}
                                aria-haspopup="true"
                                aria-expanded={open ? 'true' : undefined}
                                onClick={handleClick}
                                sx={{ color: 'text.primary' }}
                            >
                                <ExpandMoreIcon />
                            </IconButton>
                        </Tooltip>

                        <Menu
                            id="basic-menu-column-dropdown"
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            slotProps={{
                                list: {
                                    'aria-labelledby': 'basic-column-dropdown',
                                },
                            }}
                        >
                            <MenuItem>
                                <ListItemIcon>
                                    <AddCardIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Add New Card</ListItemText>
                            </MenuItem>
                            <MenuItem>
                                <ListItemIcon>
                                    <ContentCut fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Cut</ListItemText>
                            </MenuItem>
                            <MenuItem>
                                <ListItemIcon>
                                    <ContentCopy fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Copy</ListItemText>
                            </MenuItem>
                            <MenuItem>
                                <ListItemIcon>
                                    <ContentPaste fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Paste</ListItemText>
                            </MenuItem>
                            <Divider />
                            <MenuItem>
                                <ListItemIcon><Cloud fontSize="small" /></ListItemIcon>
                                <ListItemText>Archive this column</ListItemText>
                            </MenuItem>
                            <MenuItem>
                                <ListItemIcon><DeleteForeverIcon fontSize="small" /></ListItemIcon>
                                <ListItemText>Remove this column</ListItemText>
                            </MenuItem>
                        </Menu>
                    </Box>
                </Box>

                {/* Box List Card */}
                <ListCards cards={orderedCards} />

                {/* Box Column Footer */}
                <Box sx={{
                    height: (theme) => (theme.custom.columnFooterHeight),
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
                >
                    <Button startIcon={<AddCardIcon />}>Add new card</Button>
                    <Tooltip title="Drag to move">
                        <DragHandleIcon sx={{
                            cursor: 'pointer'
                        }} />
                    </Tooltip>
                </Box>
            </Box>
        </div>
    )
}

export default Column