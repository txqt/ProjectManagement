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
import { usePermissionAttribute } from '~/hooks/usePermissionAttribute';
import { Box, Chip } from '@mui/material';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useIsTemplateBoard } from '~/hooks/useIsTemplateBoard';

const Card = memo(({ card, onOpen, isDragging, isPending }) => {
  const dndAttr = usePermissionAttribute('cards.move', card.boardId);

  const isTemplate = useIsTemplateBoard();

  const storeCard = useBoardStore(s => {
    const cols = s.board?.columns ?? [];
    if (!card?.id || !card?.columnId) return null;
    const col = cols.find(c => c.id === card.columnId);
    return col?.cards?.find(c => c.id === card.id) ?? null;
  });
  const currentCard = storeCard ?? card;

  const shouldShowCardAction = () => {
    const hasChecklistWithItems = !!currentCard?.checklists?.some(
      cl => (cl.items?.length ?? 0) > 0
    );

    return (
      !!currentCard?.members?.length ||
      !!currentCard?.comments?.length ||
      !!currentCard?.attachments?.length ||
      hasChecklistWithItems
    );
  };

  const handleClick = (e) => {
    // tránh mở dialog khi đang kéo
    if (isDragging) return;
    // ngăn bubble vì parent có draggable
    e.stopPropagation();
    if (typeof onOpen === 'function') onOpen(currentCard);
  };

  const calculateChecklistProgress = () => {
    if (!currentCard?.checklists || currentCard.checklists.length === 0) return null;

    let totalItems = 0;
    let completedItems = 0;

    currentCard.checklists.forEach(checklist => {
      const items = checklist.items || [];
      totalItems += items.length;
      completedItems += items.filter(i => i.isCompleted).length;
    });

    if (totalItems === 0) return null;

    return {
      completed: completedItems,
      total: totalItems,
      percentage: Math.round((completedItems / totalItems) * 100),
    };
  };

  const checklistProgress = calculateChecklistProgress();

  return (
    <MuiCard
      {...dndAttr}
      sx={{
        cursor: isTemplate ? 'default' : 'pointer',
        boxShadow: '0 1px 1px rgba(0,0,0,0.2)',
        overflow: 'unset',
        border: '1px solid transparent',
        '&:hover': { borderColor: isTemplate ? 'transparent' : (theme) => theme.palette.primary.main },
        opacity: isPending ? 0.5 : (isTemplate ? 0.8 : 1),
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

      {/* Labels */}
      {currentCard?.labels && currentCard?.labels?.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', p: 1 }}>
          {currentCard.labels.slice(0, 3).map((label) => (
            <Chip
              key={label.id}
              label={label.title}
              size="small"
              sx={{
                bgcolor: label.color,
                color: '#fff',
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 500,
                '& .MuiChip-label': {
                  px: 1,
                },
              }}
            />
          ))}
          {(currentCard.labels?.length ?? 0) > 3 && (
            <Chip
              label={`+${currentCard.labels.length - 3}`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                bgcolor: 'action.selected',
                '& .MuiChip-label': {
                  px: 1,
                },
              }}
            />
          )}
        </Box>
      )}

      <CardContent sx={{ p: 1.5, '&:last-child': { p: 1.5 } }}>
        <Typography noWrap>{currentCard?.title}</Typography>
      </CardContent>

      {shouldShowCardAction() && (
        <CardActions sx={{ p: '0 4px 8px 4px' }}>
          {!!currentCard?.members.length && (
            <Button size='small' startIcon={<GroupIcon />}>
              {currentCard?.members.length}
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
          {checklistProgress && (
            <Chip
              icon={<CheckBoxIcon />}
              label={`${checklistProgress.completed}/${checklistProgress.total}`}
              size="small"
              sx={{
                height: 24,
                bgcolor: checklistProgress.percentage === 100 ? 'success.main' : 'action.selected',
                color: checklistProgress.percentage === 100 ? '#fff' : 'text.primary',
                '& .MuiChip-icon': {
                  color: checklistProgress.percentage === 100 ? '#fff' : 'text.secondary',
                },
              }}
            />
          )}
        </CardActions>
      )}
    </MuiCard>
  );
}, (prev, next) => {
  const p = prev.card
  const n = next.card

  if (p?.id !== n?.id) return false
  if (p?.title !== n?.title) return false
  if (p?.cover !== n?.cover) return false
  if (p?.rank !== n?.rank) return false

  // count compare
  if (p?.members?.length !== n?.members?.length) return false
  if (p?.comments?.length !== n?.comments?.length) return false
  if (p?.attachments?.length !== n?.attachments?.length) return false

  // new: labels & checklists
  if (p?.labels?.length !== n?.labels?.length) return false
  if (p?.checklists?.length !== n?.checklists?.length) return false

  // states
  if (prev.isDragging !== next.isDragging) return false
  if (prev.isPending !== next.isPending) return false

  return true
});

Card.displayName = 'Card'

export default Card;