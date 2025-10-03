import {
    attachClosestEdge,
    extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import AttachmentIcon from '@mui/icons-material/Attachment';
import CommentIcon from '@mui/icons-material/Comment';
import GroupIcon from '@mui/icons-material/Group';
import {
    Box,
    Button,
    CardActions,
    CardContent,
    CardMedia,
    Card as MuiCard,
    Typography
} from '@mui/material';
import { memo, useEffect, useRef, useState } from 'react';

const Card = memo(({ card, columnId }) => {
  const cardRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    return combine(
      draggable({
        element: el,
        getInitialData: () => ({ 
          type: 'card', 
          cardId: card.id, 
          columnId: columnId 
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element: el,
        getData: ({ input, element }) => {
          const data = { type: 'card', cardId: card.id, columnId: columnId };
          return attachClosestEdge(data, {
            input,
            element,
            allowedEdges: ['top', 'bottom'],
          });
        },
        canDrop: ({ source }) => {
          return source.data.type === 'card' && source.data.cardId !== card.id;
        },
        onDrag: ({ self }) => {
          const edge = extractClosestEdge(self.data);
          setClosestEdge(edge);
        },
        onDragLeave: () => setClosestEdge(null),
        onDrop: () => setClosestEdge(null),
      })
    );
  }, [card.id, columnId]);

  const shouldShowCardAction = () => {
    return (
      !!card?.memberIds?.length ||
      !!card?.comments?.length ||
      !!card?.attachments?.length
    );
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {closestEdge === 'top' && (
        <Box sx={{ 
          position: 'absolute', 
          top: -2, 
          left: 0, 
          right: 0, 
          height: 2, 
          bgcolor: '#1976d2',
          zIndex: 1
        }} />
      )}
      
      <MuiCard
        ref={cardRef}
        sx={{
          cursor: 'pointer',
          boxShadow: '0 1px 1px rgba(0,0,0,0.2)',
          overflow: 'unset',
          border: '1px solid transparent',
          opacity: isDragging ? 0.5 : 1,
          '&:hover': { borderColor: (theme) => theme.palette.primary.main }
        }}
      >
        {card?.cover && <CardMedia sx={{ height: 140 }} image={card?.cover} />}

        <CardContent sx={{ p: 1.5, '&:last-child': { p: 1.5 } }}>
          <Typography>{card?.title}</Typography>
        </CardContent>

        {shouldShowCardAction() && (
          <CardActions sx={{ p: '0 4px 8px 4px' }}>
            {!!card?.memberIds?.length && (
              <Button size='small' startIcon={<GroupIcon />}>
                {card?.memberIds?.length}
              </Button>
            )}
            {!!card?.comments?.length && (
              <Button size='small' startIcon={<CommentIcon />}>
                {card?.comments?.length}
              </Button>
            )}
            {!!card?.attachments?.length && (
              <Button size='small' startIcon={<AttachmentIcon />}>
                {card?.attachments?.length}
              </Button>
            )}
          </CardActions>
        )}
      </MuiCard>

      {closestEdge === 'bottom' && (
        <Box sx={{ 
          position: 'absolute', 
          bottom: -2, 
          left: 0, 
          right: 0, 
          height: 2, 
          bgcolor: '#1976d2',
          zIndex: 1
        }} />
      )}
    </Box>
  );
});

export default Card;