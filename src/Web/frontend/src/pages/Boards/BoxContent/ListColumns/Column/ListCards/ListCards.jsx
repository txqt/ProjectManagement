import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import Card from './Card/Card';
import CardDetailDialog from './Card/CardDetailDialog';
import ListCardsSkeleton from './ListCardsSkeleton';

function SortableItem({ card, children, onContextMenu }) {
    const cardRef = useRef(card);
    useEffect(() => {
        cardRef.current = card;
    }, [card]);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: card.id, data: { ...cardRef.current } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        border: isDragging ? '1px solid #2ecc71' : undefined,
    };

    // inject isDragging into single React child if possible
    const childWithProps = React.isValidElement(children)
        ? React.cloneElement(children, { isDragging })
        : children;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onContextMenu={(e) => {
                if (typeof onContextMenu === 'function') onContextMenu(e);
            }}
        >
            {childWithProps}
        </div>
    );
}

const ListCards = memo(({ ...props }) => {
    // menu state: position-based (use anchorReference="anchorPosition")
    const [menuPos, setMenuPos] = React.useState(null); // { mouseX, mouseY }
    const [selectedCard, setSelectedCard] = React.useState(null);

    // dialog state
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [dialogCard, setDialogCard] = React.useState(null);

    const deleteCard = props.deleteCard;

    const openMenu = useCallback((event, card) => {
        event.preventDefault();
        event.stopPropagation();

        setSelectedCard(card);
        setMenuPos({
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
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

    if (!props.cards) return <ListCardsSkeleton count={5} />;

    return (
        <>
            <SortableContext
                items={props.cards?.map((c) => c.id)}
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
                        '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#dfc2cf' },
                    }}
                >
                    {props.cards?.map((card) => {
                        const isCardPending = props.pendingTempIds?.has?.(card.id) ?? false;
                        return (
                            <SortableItem
                                key={card.id}
                                card={card}
                                onContextMenu={(e) => openMenu(e, card)}
                            >
                                <Card card={card} onOpen={handleOpenCardDialog} isPending={isCardPending} />
                            </SortableItem>
                        );
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
            />
        </>
    );
});

export default ListCards;