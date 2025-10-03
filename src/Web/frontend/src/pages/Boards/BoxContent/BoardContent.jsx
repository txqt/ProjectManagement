import {
    extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef } from 'react';

import {
    Box
} from '@mui/material';
import ListColumns from './ListColumns/ListColumns';

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
                <ListColumns
                    columns={board?.columns}
                    createCard={createCard}
                    deleteColumn={deleteColumn}
                    deleteCard={deleteCard}
                    pendingTempIds={pendingTempIds}
                    onReorderCards={reorderCards}
                    onMoveCard={moveCard}
                    onReorderColumns={reorderColumns}
                    createColumn={createColumn}
                />

            </Box>
        </Box>
    );
}