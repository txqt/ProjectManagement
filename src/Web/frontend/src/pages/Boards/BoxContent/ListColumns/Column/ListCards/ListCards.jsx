// ListCards.jsx
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Card from './Card/Card';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { memo, useCallback, useState } from 'react';
import ListCardsSkeleton from './ListCardsSkeleton';
import CardDetailDialog from './Card/CardDetailDialog'; // component mới

const ListCards = memo(({ cards, deleteCard, pendingTempIds, ...props }) => {
    const { updateCard } = props;
    // menu state: position-based (use anchorReference="anchorPosition")
    const [menuPos, setMenuPos] = useState(null); // { mouseX, mouseY }
    const [selectedCard, setSelectedCard] = useState(null);

    // dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogCard, setDialogCard] = useState(null);

    const openMenu = useCallback((event, card) => {
        event.preventDefault();
        event.stopPropagation();

        setSelectedCard(card);
        setMenuPos({
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6
        });
    }, []);

    const closeMenu = useCallback(() => {
        setMenuPos(null);
        setSelectedCard(null);
    }, []);

    const handleDelete = useCallback(async () => {
        closeMenu();
        if (!selectedCard) return;
        if (typeof deleteCard === 'function') {
            try {
                await deleteCard(selectedCard.columnId, selectedCard.id);
            } catch (e) {
                console.error('deleteCard error', e);
            }
        } else {
            console.warn('deleteCard prop not provided');
        }
    }, [deleteCard, selectedCard, closeMenu]);

    // mở dialog khi click vào card
    const handleOpenCardDialog = useCallback((card) => {
        setDialogCard(card);
        setDialogOpen(true);
    }, []);

    const handleCloseDialog = useCallback(() => {
        setDialogOpen(false);
        setDialogCard(null);
    }, []);

    if (!cards) return <ListCardsSkeleton count={5} />;

    return (
        <>
            <SortableContext
                items={cards?.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
            >
                <Box
                    sx={{
                        p: '0 5px 5px 5px',
                        m: '0 5px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        maxHeight: (theme) => `calc(
                        ${theme.custom.boardContentHeight} -
                        ${theme.spacing(5)} -
                        ${theme.custom.columnHeaderHeight} -
                        ${theme.custom.columnFooterHeight}
                        )`,
                        '&::-webkit-scrollbar-thumb': { backgroundColor: '#ced0da' },
                        '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#dfc2cf' }
                    }}
                >
                    {cards?.map((card) => {
                        const isCardPending = pendingTempIds?.has?.(card.id) ?? false;
                        return (
                            <div
                                key={card.id}
                                onContextMenu={(e) => openMenu(e, card)}
                                style={{
                                    opacity: isCardPending ? 0.5 : 1,
                                    pointerEvents: isCardPending ? 'none' : 'auto',
                                    transition: 'opacity 0.2s ease'
                                }}
                            >
                                <Card card={card} onOpen={handleOpenCardDialog} />
                            </div>
                        )
                    })}
                </Box>
            </SortableContext>

            <Menu
                open={!!menuPos}
                onClose={closeMenu}
                anchorReference="anchorPosition"
                anchorPosition={menuPos ? { top: menuPos.mouseY, left: menuPos.mouseX } : undefined}
                PaperProps={{ onContextMenu: (e) => e.preventDefault() }}
            >
                <MenuItem onClick={handleDelete}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>

            <CardDetailDialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                card={dialogCard}
                updateCard={updateCard}
            />
        </>
    );
});

export default ListCards;