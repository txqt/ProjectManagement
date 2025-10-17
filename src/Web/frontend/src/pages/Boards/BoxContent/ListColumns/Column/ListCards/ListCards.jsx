// ===== FILE: ListCards.jsx (OPTIMIZED) =====
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import React, { memo, useCallback } from 'react';
import Card from './Card/Card';
import CardDetailDialog from './Card/CardDetailDialog';
import ListCardsSkeleton from './ListCardsSkeleton';
import ConditionalRender from '~/components/ConditionalRender/ConditionalRender';

// OPTIMIZATION: Tách sortable wrapper ra component riêng
const SortableCardWrapper = memo(function SortableCardWrapper({ card, onContextMenu, onOpen, isPending }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: card.id,
      data: { ...card }
    });

  // OPTIMIZATION: Chỉ wrapper nhận transform, Card bên trong stable
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    border: isDragging ? '1px solid #2ecc71' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onContextMenu={onContextMenu}
    >
      <Card card={card} onOpen={onOpen} isDragging={isDragging} isPending={isPending} />
    </div>
  );
}, (prevProps, nextProps) => {
  // OPTIMIZATION: Wrapper chỉ re-render khi card hoặc pending thay đổi

  if (prevProps.card?.id !== nextProps.card?.id) return false
  if (prevProps.card?.rank !== nextProps.card?.rank) return false
  if (prevProps.isPending !== nextProps.isPending) return false

  // IMPORTANT: Phải pass through card changes
  if (prevProps.card !== nextProps.card) return false

  return true
})

const ListCards = memo(({ cards, deleteCard, pendingTempIds }) => {
  // menu state: position-based (use anchorReference="anchorPosition")
  const [menuPos, setMenuPos] = React.useState(null);
  const [selectedCard, setSelectedCard] = React.useState(null);

  // dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogCard, setDialogCard] = React.useState(null);

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
            '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#dfc2cf' },
          }}
        >
          {cards?.map((card) => {
            const isCardPending = pendingTempIds?.has?.(card.id) ?? false;
            return (
              <SortableCardWrapper
                key={card.id}
                card={card}
                isPending={isCardPending}
                onContextMenu={(e) => openMenu(e, card)}
                onOpen={handleOpenCardDialog}
              />
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
        <ConditionalRender permission="cards.delete">
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </ConditionalRender>
      </Menu>

      <ConditionalRender permission="cards.edit">
        <CardDetailDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          card={dialogCard}
        />
      </ConditionalRender>
    </>
  );
}, (prevProps, nextProps) => {
  // OPTIMIZATION: Custom comparison cho ListCards
  // IMPORTANT: Phải cho phép re-render khi cards reorder hoặc move

  const prevCards = prevProps.cards || []
  const nextCards = nextProps.cards || []

  // Nếu length khác → chắc chắn re-render
  if (prevCards.length !== nextCards.length) return false

  // So sánh order - chỉ cần check id và rank
  for (let i = 0; i < prevCards.length; i++) {
    if (prevCards[i]?.id !== nextCards[i]?.id) return false
    if (prevCards[i]?.rank !== nextCards[i]?.rank) return false
  }

  // So sánh pendingTempIds
  if (prevProps.pendingTempIds !== nextProps.pendingTempIds) return false

  // Nếu columnId thay đổi (edge case)
  if (prevProps.columnId !== nextProps.columnId) return false

  return true
});

ListCards.displayName = 'ListCards'

export default ListCards;