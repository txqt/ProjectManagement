// ============ UPDATED: BoardContent.jsx ============
import Box from '@mui/material/Box';
import ListColumns from './ListColumns/ListColumns';
import { sortColumnsByRank } from '~/utils/sorts';
import { MouseSensor, TouchSensor } from '~/customLibraries/DndKitSensors';
import {
    DndContext,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    closestCorners,
    pointerWithin,
    getFirstCollision
} from '@dnd-kit/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import Column from './ListColumns/Column/Column';
import Card from './ListColumns/Column/ListCards/Card/Card';
import { cloneDeep } from 'lodash';
import { ACTIVE_DRAG_ITEM_TYPE } from '~/utils/constants';
import { createPortal } from 'react-dom';

function BoardContent({ board, ...props }) {
    const { createColumn, updateColumn, createCard, updateCard,
        deleteColumn, reorderColumns, reorderCards, moveCard, deleteCard,
        pendingTempIds, assignCardMember, unassignCardMember } = props;

    const mouseSensor = useSensor(MouseSensor, {
        activationConstraint: { distance: 5 }
    });
    const touchSensor = useSensor(TouchSensor, {
        activationConstraint: {
            delay: 250,
            tolerance: 500
        }
    });
    const sensors = useSensors(mouseSensor, touchSensor);

    const [orderedColumns, setOrderedColumns] = useState([]);
    const [activeDragItemId, setActiveDragItemId] = useState(null);
    const [activeDragItemType, setActiveDragItemType] = useState(null);
    const [activeDragItemData, setActiveDragItemData] = useState(null);
    const [oldColumnWhenDraggingCard, setOldColumnWhenDraggingCard] = useState(null);
    const lastOverId = useRef(null);
    const [oldCardIndexWhenDragging, setOldCardIndexWhenDragging] = useState(null);

    useEffect(() => {
        setOrderedColumns(sortColumnsByRank(board?.columns));
    }, [board]);

    // Find column by card or column id
    const findColumnByCardId = useCallback((cardOrColumnId) => {
        return orderedColumns.find((column) =>
            column.id === cardOrColumnId ||
            column?.cards?.map((card) => card.id)?.includes(cardOrColumnId)
        );
    }, [orderedColumns]);

    // Move card between different columns
    const moveCardBetweenDifferentColumns = (
        overColumn,
        overCardId,
        active,
        over,
        activeColumn,
        activeDraggingCardId,
        activeDraggingCardData
    ) => {
        setOrderedColumns((prevColumns) => {
            const overCardIndex = overColumn?.cards?.findIndex(
                (card) => card.id === overCardId
            );
            let newCardIndex;
            const isBelowOverItem =
                active.rect.current.translated &&
                active.rect.current.translated.top > over.rect.top + over.rect.height;
            const modifier = isBelowOverItem ? 1 : 0;
            newCardIndex =
                overCardIndex >= 0
                    ? overCardIndex + modifier
                    : overColumn?.cards?.length;

            const nextColumns = cloneDeep(prevColumns);
            const nextActiveColumn = nextColumns.find(
                (column) => column.id === activeColumn.id
            );
            const nextOverColumn = nextColumns.find(
                (column) => column.id === overColumn.id
            );

            if (nextActiveColumn) {
                nextActiveColumn.cards = nextActiveColumn.cards.filter(
                    (card) => card.id !== activeDraggingCardId
                );
                // CHANGED: Don't update cardOrderIds anymore
            }
            if (nextOverColumn) {
                nextOverColumn.cards = nextOverColumn.cards.filter(
                    (card) => card.id !== activeDraggingCardId
                );
                const rebuild_activeDraggingCardData = {
                    ...activeDraggingCardData,
                    columnId: nextOverColumn.id
                };
                nextOverColumn.cards = nextOverColumn.cards.toSpliced(
                    newCardIndex,
                    0,
                    rebuild_activeDraggingCardData
                );
                nextOverColumn.cards = nextOverColumn.cards.filter(
                    (card) => !card.FE_PlaceholderCard
                );
                // CHANGED: Don't update cardOrderIds anymore
            }
            return nextColumns;
        });
    };

    const handleDragStart = (event) => {
        setActiveDragItemId(event?.active?.id);
        setActiveDragItemType(
            event?.active?.data?.current?.columnId
                ? ACTIVE_DRAG_ITEM_TYPE.CARD
                : ACTIVE_DRAG_ITEM_TYPE.COLUMN
        );
        setActiveDragItemData(event?.active?.data?.current);

        if (event?.active?.data?.current?.columnId) {
            const col = findColumnByCardId(event?.active?.id);
            setOldColumnWhenDraggingCard(col);
            const idx = col?.cards?.findIndex(c => c.id === event?.active?.id) ?? null;
            setOldCardIndexWhenDragging(idx);
        }
    };

    const handleDragOver = useCallback((event) => {
        if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return;
        const { active, over } = event;
        if (!active || !over) return;
        const {
            id: activeDraggingCardId,
            data: { current: activeDraggingCardData }
        } = active;
        const { id: overCardId } = over;
        const activeColumn = findColumnByCardId(activeDraggingCardId);
        const overColumn = findColumnByCardId(overCardId);
        if (!activeColumn || !overColumn) return;

        if (activeColumn.id !== overColumn.id) {
            moveCardBetweenDifferentColumns(
                overColumn,
                overCardId,
                active,
                over,
                activeColumn,
                activeDraggingCardId,
                activeDraggingCardData
            );
        }
    }, [activeDragItemType, orderedColumns, findColumnByCardId]);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!active || !over) return;
        const prevOrdered = cloneDeep(orderedColumns);

        // Card drag end
        if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
            const {
                id: activeDraggingCardId,
                data: { current: activeDraggingCardData }
            } = active;
            const { id: overCardId } = over;
            const activeColumn = findColumnByCardId(activeDraggingCardId);
            const overColumn = findColumnByCardId(overCardId);
            if (!activeColumn || !overColumn) return;

            if (oldColumnWhenDraggingCard.id !== overColumn.id) {
                moveCardBetweenDifferentColumns(
                    overColumn,
                    overCardId,
                    active,
                    over,
                    activeColumn,
                    activeDraggingCardId,
                    activeDraggingCardData
                );

                const overCardIndex = overColumn?.cards?.findIndex(c => c.id === overCardId);
                const isBelowOverItem =
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;
                const modifier = isBelowOverItem ? 1 : 0;
                const newIndex = overCardIndex >= 0 ? overCardIndex + modifier : (overColumn?.cards?.length ?? 0);

                try {
                    // CHANGED: Pass card ranks instead of cardOrderIds
                    const cardRanks = overColumn.cards
                        .filter(c => c.id !== activeDraggingCardId)
                        .map(c => c.rank);

                    console.log('cardRanks:', cardRanks);

                    console.log({
                        oldColumnId: oldColumnWhenDraggingCard?.id,
                        overColumnId: overColumn?.id,
                        activeDraggingCardId,
                        newIndex
                    });


                    await moveCard(oldColumnWhenDraggingCard.id, overColumn.id, activeDraggingCardId, newIndex);
                } catch (err) {
                    console.error("moveCard API error", err);
                    setOrderedColumns(prevOrdered);
                }
            } else {
                const oldCardIndex = oldCardIndexWhenDragging ?? oldColumnWhenDraggingCard?.cards?.findIndex(
                    (c) => c.id === activeDragItemId
                );
                const newCardIndex = overColumn?.cards?.findIndex(
                    (c) => c.id === overCardId
                );

                // If user dropped on the same spot -> do nothing (no API call)
                if (oldCardIndex === newCardIndex) {
                    // reset states (we already updated optimistic UI earlier)
                    setActiveDragItemId(null);
                    setActiveDragItemType(null);
                    setActiveDragItemData(null);
                    setOldColumnWhenDraggingCard(null);
                    setOldCardIndexWhenDragging(null);
                    return;
                }

                const dndOrderedCards = arrayMove(
                    oldColumnWhenDraggingCard?.cards,
                    oldCardIndex,
                    newCardIndex
                );
                setOrderedColumns((prevColumns) => {
                    const nextColumns = cloneDeep(prevColumns);
                    const targetColumn = nextColumns.find(
                        (column) => column.id === overColumn.id
                    );
                    targetColumn.cards = dndOrderedCards;
                    return nextColumns;
                });

                try {
                    // Gửi chỉ list cardId theo thứ tự mới
                    const cardIds = dndOrderedCards.map(c => c.id);
                    await reorderCards(overColumn.id, cardIds);
                } catch (err) {
                    console.error("reorderCards API error", err);
                    setOrderedColumns(prevOrdered);
                } finally {
                    setActiveDragItemId(null);
                    setActiveDragItemType(null);
                    setActiveDragItemData(null);
                    setOldColumnWhenDraggingCard(null);
                    setOldCardIndexWhenDragging(null);
                }
            }
        }

        // Column drag end
        if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
            if (active.id !== over.id) {
                const oldColumnIndex = orderedColumns.findIndex((c) => c.id === active.id);
                const newColumnIndex = orderedColumns.findIndex((c) => c.id === over.id);
                const dndOrderedColumns = arrayMove(orderedColumns, oldColumnIndex, newColumnIndex);
                setOrderedColumns(dndOrderedColumns);

                try {
                    // CHANGED: Pass column IDs in new order (API will recalculate ranks)
                    const columnIds = dndOrderedColumns.map((column) => column.id);
                    await reorderColumns(columnIds);
                } catch (error) {
                    console.error("reorderColumns API error", error);
                    setOrderedColumns(prevOrdered);
                }
            }
        }

        setActiveDragItemId(null);
        setActiveDragItemType(null);
        setActiveDragItemData(null);
        setOldColumnWhenDraggingCard(null);
    };

    const customDropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5'
                }
            }
        })
    };

    const collisionDetectionStrategy = useCallback(
        (args) => {
            if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
                const columnContainers = args.droppableContainers.filter(
                    (c) => c.data?.current?.__type === 'COLUMN' || orderedColumns.some(col => col.id === c.id)
                );
                return closestCorners({ ...args, droppableContainers: columnContainers });
            }

            const pointerIntersections = pointerWithin(args);
            if (!pointerIntersections?.length) return [];
            let overId = getFirstCollision(pointerIntersections, 'id');
            if (overId) {
                const checkColumn = orderedColumns.find((column) => column.id === overId);
                if (checkColumn) {
                    if (checkColumn?.cards?.length > 0) {
                        const innerOver = closestCorners({
                            ...args,
                            droppableContainers: args.droppableContainers.filter(
                                (container) =>
                                    container.id !== overId &&
                                    checkColumn.cards.map(c => c.id).includes(container.id)
                            )
                        })[0]?.id;
                        if (innerOver) {
                            overId = innerOver;
                        }
                    }
                }
                lastOverId.current = overId;
                return [{ id: overId }];
            }
            return [];
        },
        [activeDragItemType, orderedColumns]
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={collisionDetectionStrategy}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <Box
                sx={{
                    bgcolor: (theme) =>
                        theme.palette.mode === 'dark' ? '#34495e' : '#1976d2',
                    width: '100%',
                    height: (theme) => theme.custom.boardContentHeight,
                    p: '10px 0'
                }}
            >
                <ListColumns
                    columns={orderedColumns}
                    createColumn={createColumn}
                    updateCard={updateCard}
                    updateColumn={updateColumn}
                    createCard={createCard}
                    deleteColumn={deleteColumn}
                    deleteCard={deleteCard}
                    pendingTempIds={pendingTempIds}
                    assignCardMember={assignCardMember}
                    unassignCardMember={unassignCardMember} />
                {createPortal(
                    <DragOverlay dropAnimation={customDropAnimation}>
                        {activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN && (
                            <Column column={activeDragItemData} />
                        )}
                        {activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD && (
                            <Card card={activeDragItemData} />
                        )}
                    </DragOverlay>,
                    document.body
                )}
            </Box>
        </DndContext>
    );
}

export default BoardContent;