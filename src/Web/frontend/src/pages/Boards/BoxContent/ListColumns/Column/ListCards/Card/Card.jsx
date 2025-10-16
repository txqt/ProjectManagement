// ===== FILE: Card.jsx (OPTIMIZED) =====
import React, { memo } from 'react';
import CommentIcon from '@mui/icons-material/Comment';
import AttachmentIcon from '@mui/icons-material/Attachment';
import GroupIcon from '@mui/icons-material/Group';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';
import { Card as MuiCard } from '@mui/material';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useBoardStore } from '~/stores/boardStore';

// OPTIMIZATION: Card chỉ render khi data thực sự thay đổi
const Card = memo(({ card, onOpen, isDragging, isPending }) => {
  const storeCard = useBoardStore(s => {
    const cols = s.board?.columns ?? [];
    if (!card?.id || !card?.columnId) return null;
    const col = cols.find(c => c.id === card.columnId);
    return col?.cards?.find(c => c.id === card.id) ?? null;
  });
  const currentCard = storeCard ?? card;
  
  const shouldShowCardAction = () => {
    return (
      !!currentCard?.memberIds?.length ||
      !!currentCard?.comments?.length ||
      !!currentCard?.attachments?.length
    );
  };

  const handleClick = (e) => {
    // tránh mở dialog khi đang kéo
    if (isDragging) return;
    // ngăn bubble vì parent có draggable
    e.stopPropagation();
    if (typeof onOpen === 'function') onOpen(currentCard);
  };

  return (
    <MuiCard
      sx={{
        cursor: 'pointer',
        boxShadow: '0 1px 1px rgba(0,0,0,0.2)',
        overflow: 'unset',
        border: '1px solid transparent',
        '&:hover': { borderColor: (theme) => theme.palette.primary.main },
        opacity: isPending ? 0.5 : 1,
        pointerEvents: isPending ? 'none' : 'auto',
        transition: 'opacity 0.2s ease',
      }}
      onClick={handleClick}
    >
      {currentCard?.cover &&
        <CardMedia sx={{ height: 140 }}
          fetchPriority="high"
          decoding="async"
          image={currentCard?.cover} />}

      <CardContent sx={{ p: 1.5, '&:last-child': { p: 1.5 } }}>
        <Typography noWrap>{currentCard?.title}</Typography>
      </CardContent>

      {shouldShowCardAction() && (
        <CardActions sx={{ p: '0 4px 8px 4px' }}>
          {!!currentCard?.memberIds?.length && (
            <Button size='small' startIcon={<GroupIcon />}>
              {currentCard?.memberIds?.length}
            </Button>
          )}

          {!!currentCard?.comments?.length && (
            <Button size='small' startIcon={<CommentIcon />}>
              {currentCard?.comments?.length}
            </Button>
          )}

          {!!currentCard?.attachments?.length && (
            <Button size='small' startIcon={<AttachmentIcon />}>
              {currentCard?.attachments?.length}
            </Button>
          )}
        </CardActions>
      )}
    </MuiCard>
  );
}, (prevProps, nextProps) => {
  // OPTIMIZATION: Custom comparison - chỉ re-render khi cần thiết

  // So sánh card data
  if (prevProps.card?.id !== nextProps.card?.id) return false
  if (prevProps.card?.title !== nextProps.card?.title) return false
  if (prevProps.card?.cover !== nextProps.card?.cover) return false
  if (prevProps.card?.rank !== nextProps.card?.rank) return false

  // So sánh counts (không cần deep compare arrays)
  if (prevProps.card?.memberIds?.length !== nextProps.card?.memberIds?.length) return false
  if (prevProps.card?.comments?.length !== nextProps.card?.comments?.length) return false
  if (prevProps.card?.attachments?.length !== nextProps.card?.attachments?.length) return false

  // So sánh states
  if (prevProps.isDragging !== nextProps.isDragging) return false
  if (prevProps.isPending !== nextProps.isPending) return false

  // Không so sánh onOpen vì nó stable (useCallback trong parent)

  return true // Không cần re-render
});

Card.displayName = 'Card'

export default Card;