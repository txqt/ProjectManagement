import {
    extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import CloseIcon from '@mui/icons-material/Close';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import {
    Box,
    Button,
    TextField
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import Column from './Column/Column';

export default function BoardContent({
    board,
    createColumn,
    createCard,
    deleteColumn,
    reorderColumns,
    reorderCards,
    moveCard,
    deleteCard,
    pendingTempIds
}) {
    const boardRef = useRef(null);
    const [openNewColumnForm, setOpenNewColumnForm] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');

    const toggleOpenNewColumnForm = () => setOpenNewColumnForm(!openNewColumnForm);

    // Handle drop events
    useEffect(() => {
        const el = boardRef.current;
        if (!el) return;

        return dropTargetForElements({
            element: el,
            onDrop: ({ source, location }) => {
                const destination = location.current.dropTargets[0];
                if (!destination) return;

                const destData = destination.data;
                const sourceData = source.data;

                // Column reordering
                if (sourceData.type === 'column' && destData.type === 'column') {
                    const sourceColumnId = sourceData.columnId;
                    const destColumnId = destData.columnId;
                    const edge = extractClosestEdge(destData);

                    if (sourceColumnId === destColumnId) return;

                    const columnIds = board.columns.map(c => c.id);
                    const sourceIndex = columnIds.indexOf(sourceColumnId);
                    const destIndex = columnIds.indexOf(destColumnId);

                    const newColumnIds = [...columnIds];
                    newColumnIds.splice(sourceIndex, 1);

                    const finalDestIndex = edge === 'right' ? destIndex : destIndex;
                    newColumnIds.splice(finalDestIndex, 0, sourceColumnId);

                    reorderColumns?.(newColumnIds);
                }

                // Card reordering within same column
                if (sourceData.type === 'card' && destData.type === 'card') {
                    const sourceColumnId = sourceData.columnId;
                    const destColumnId = destData.columnId;
                    const sourceCardId = sourceData.cardId;
                    const destCardId = destData.cardId;
                    const edge = extractClosestEdge(destData);

                    if (sourceColumnId === destColumnId) {
                        // Reorder within same column
                        const column = board.columns.find(c => c.id === sourceColumnId);
                        if (!column) return;

                        const cardIds = column.cards.map(c => c.id);
                        const sourceIndex = cardIds.indexOf(sourceCardId);
                        const destIndex = cardIds.indexOf(destCardId);

                        const newCardIds = [...cardIds];
                        newCardIds.splice(sourceIndex, 1);

                        const finalDestIndex = edge === 'bottom' ? destIndex + 1 : destIndex;
                        newCardIds.splice(sourceIndex < destIndex ? finalDestIndex - 1 : finalDestIndex, 0, sourceCardId);

                        reorderCards?.(sourceColumnId, newCardIds);
                    } else {
                        // Move to different column
                        const destColumn = board.columns.find(c => c.id === destColumnId);
                        if (!destColumn) return;

                        const destCardIds = destColumn.cards.map(c => c.id);
                        const destIndex = destCardIds.indexOf(destCardId);
                        const finalDestIndex = edge === 'bottom' ? destIndex + 1 : destIndex;

                        moveCard?.(sourceCardId, sourceColumnId, destColumnId, finalDestIndex);
                    }
                }
            },
        });
    }, [board, reorderColumns, reorderCards, moveCard]);

    const addNewColumn = async () => {
        if (!newColumnTitle) {
            alert('Please enter Column Title');
            return;
        }
        try {
            await createColumn({
                title: newColumnTitle,
                description: 'description',
                type: 'public'
            });
            toggleOpenNewColumnForm();
            setNewColumnTitle('');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Box sx={{
            bgcolor: '#1976d2',
            width: '100%',
            height: 'calc(100vh - 100px)',
            p: '10px 0'
        }}>
            <Box
                ref={boardRef}
                sx={{
                    display: 'flex',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    height: '100%',
                    gap: 2,
                    px: 2,
                }}
            >
                {board?.columns?.map((column) => {
                    const isColumnPending = pendingTempIds?.has?.(column.id) ?? false;
                    return (
                        <div key={column.id} style={{
                            opacity: isColumnPending ? 0.5 : 1,
                            pointerEvents: isColumnPending ? 'none' : 'auto',
                        }}>
                            <Column
                                column={column}
                                createCard={createCard}
                                deleteColumn={deleteColumn}
                                deleteCard={deleteCard}
                                pendingTempIds={pendingTempIds}
                                onReorderCards={reorderCards}
                                onMoveCard={moveCard}
                            />
                        </div>
                    );
                })}

                {/* Add New Column */}
                {!openNewColumnForm ? (
                    <Box onClick={toggleOpenNewColumnForm} sx={{
                        minWidth: '250px',
                        borderRadius: '6px',
                        height: 'fit-content',
                        bgcolor: '#ffffff3d',
                        cursor: 'pointer'
                    }}>
                        <Button startIcon={<NoteAddIcon />} sx={{
                            color: 'white',
                            width: '100%',
                            justifyContent: 'flex-start',
                            pl: 2.5,
                            py: 1
                        }}>
                            Add new column
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{
                        minWidth: '250px',
                        p: 1,
                        borderRadius: '6px',
                        height: 'fit-content',
                        bgcolor: '#ffffff3d',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                    }}>
                        <TextField
                            label='Enter column title...'
                            size='small'
                            autoFocus
                            value={newColumnTitle}
                            onChange={(e) => setNewColumnTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addNewColumn()}
                            sx={{
                                '& label': { color: 'white' },
                                '& input': { color: 'white' },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: 'white' },
                                }
                            }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button onClick={addNewColumn} variant='contained' color='success' size='small'>
                                Add Column
                            </Button>
                            <CloseIcon fontSize='small' sx={{ color: 'white', cursor: 'pointer' }} onClick={toggleOpenNewColumnForm} />
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}