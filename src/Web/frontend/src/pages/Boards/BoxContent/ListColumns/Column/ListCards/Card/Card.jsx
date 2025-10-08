// Card/Card.jsx
import CommentIcon from '@mui/icons-material/Comment';
import AttachmentIcon from '@mui/icons-material/Attachment';
import GroupIcon from '@mui/icons-material/Group';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';
import { Card as MuiCard } from '@mui/material';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo } from 'react';

const Card = memo(({ card, onOpen }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: card.id,
        data: { ...card }
    });

    const dndKitCardStyles = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
        border: isDragging ? '1px solid #2ecc71' : undefined
    };

    const shouldShowCardAction = () => {
        return (
            !!card?.memberIds?.length ||
            !!card?.comments?.length ||
            !!card?.attachments?.length
        );
    };

    const handleClick = (e) => {
        // tránh mở dialog khi đang kéo
        if (isDragging) return;
        // ngăn bubble vì parent có draggable
        e.stopPropagation();
        if (typeof onOpen === 'function') onOpen(card);
    };

    return (
        <MuiCard
            ref={setNodeRef}
            style={dndKitCardStyles}
            {...attributes}
            {...listeners}
            sx={{
                cursor: 'pointer',
                boxShadow: '0 1px 1px rgba(0,0,0,0.2)',
                overflow: 'unset',
                border: '1px solid transparent',
                '&:hover': { borderColor: (theme) => theme.palette.primary.main }
            }}
            onClick={handleClick}
        >
            {card?.cover && <CardMedia sx={{ height: 140 }} image={card?.cover} />}

            <CardContent sx={{ p: 1.5, '&:last-child': { p: 1.5 } }}>
                <Typography noWrap>{card?.title}</Typography>
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
    );
});

export default Card;