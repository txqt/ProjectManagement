import Box from '@mui/material/Box';
import ListColumns from './ListColumns/ListColumns';
import { mapOrder } from '~/utils/sorts';
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
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
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

    // Mouse sensor: require mouse to move 5px before drag starts
    const mouseSensor = useSensor(MouseSensor, {
        activationConstraint: {
            distance: 5
        }
    });
    // Touch sensor: require 250ms hold and 500px tolerance before drag starts
    const touchSensor = useSensor(TouchSensor, {
        activationConstraint: {
            delay: 250,
            tolerance: 500
        }
    });
    // Use both sensors for best desktop/mobile experience
    const sensors = useSensors(mouseSensor, touchSensor);

    const [orderedColumns, setOrderedColumns] = useState([]);
    // Only one item can be dragged at a time
    const [activeDragItemId, setActiveDragItemId] = useState(null);
    const [activeDragItemType, setActiveDragItemType] = useState(null);
    const [activeDragItemData, setActiveDragItemData] = useState(null);
    const [oldColumnWhenDraggingCard, setOldColumnWhenDraggingCard] = useState(null);
    // Last collision id for custom collision detection
    const lastOverId = useRef(null);

    useEffect(() => {
        setOrderedColumns(mapOrder(board?.columns, board?.columnOrderIds, 'id'));
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
            // Calculate new index for dropped card
            let newCardIndex;
            const isBelowOverItem =
                active.rect.current.translated &&
                active.rect.current.translated.top > over.rect.top + over.rect.height;
            const modifier = isBelowOverItem ? 1 : 0;
            newCardIndex =
                overCardIndex >= 0
                    ? overCardIndex + modifier
                    : overColumn?.cards?.length;
            // Clone columns state
            const nextColumns = cloneDeep(prevColumns);
            const nextActiveColumn = nextColumns.find(
                (column) => column.id === activeColumn.id
            );
            const nextOverColumn = nextColumns.find(
                (column) => column.id === overColumn.id
            );
            // Remove card from old column
            if (nextActiveColumn) {
                nextActiveColumn.cards = nextActiveColumn.cards.filter(
                    (card) => card.id !== activeDraggingCardId
                );
                nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(
                    (card) => card.id
                );
            }
            // Add card to new column
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
                // Remove placeholder card if exists
                nextOverColumn.cards = nextOverColumn.cards.filter(
                    (card) => !card.FE_PlaceholderCard
                );
                nextOverColumn.cardOrderIds = nextOverColumn.cards.map(
                    (card) => card.id
                );
            }
            return nextColumns;
        });
    };

    // Handle drag start
    const handleDragStart = (event) => {
        setActiveDragItemId(event?.active?.id);
        setActiveDragItemType(
            event?.active?.data?.current?.columnId
                ? ACTIVE_DRAG_ITEM_TYPE.CARD
                : ACTIVE_DRAG_ITEM_TYPE.COLUMN
        );
        setActiveDragItemData(event?.active?.data?.current);
        // Save old column for card drag
        if (event?.active?.data?.current?.columnId) {
            setOldColumnWhenDraggingCard(findColumnByCardId(event?.active?.id));
        }
    };

    // Handle drag over (throttled)
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
        // Only handle if moving card between columns
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

    // Handle drag end
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
            // Card moved between columns
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
                // Calculate new index for API
                const overCardIndex = overColumn?.cards?.findIndex(c => c.id === overCardId);
                const isBelowOverItem =
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;
                const modifier = isBelowOverItem ? 1 : 0;
                const newIndex = overCardIndex >= 0 ? overCardIndex + modifier : (overColumn?.cards?.length ?? 0);
                try {
                    await moveCard(oldColumnWhenDraggingCard.id, overColumn.id, activeDraggingCardId, newIndex);
                } catch (err) {
                    console.error("moveCard API error", err);
                    setOrderedColumns(prevOrdered);
                }
            } else {
                // Card moved within same column
                const oldCardIndex = oldColumnWhenDraggingCard?.cards?.findIndex(
                    (c) => c.id === activeDragItemId
                );
                const newCardIndex = overColumn?.cards?.findIndex(
                    (c) => c.id === overCardId
                );
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
                    targetColumn.cardOrderIds = dndOrderedCards.map((card) => card.id);
                    return nextColumns;
                });
                try {
                    await reorderCards(
                        overColumn.id,
                        dndOrderedCards.map((card) => card.id)
                    );
                } catch (err) {
                    console.error("moveCard API error", err);
                    setOrderedColumns(prevOrdered);
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
                    await reorderColumns(dndOrderedColumns.map((column) => column.id));
                } catch (error) {
                    console.error("reorderColumns API error", error);
                    setOrderedColumns(prevOrdered);
                }
            }
        }
        // Reset drag state
        setActiveDragItemId(null);
        setActiveDragItemType(null);
        setActiveDragItemData(null);
        setOldColumnWhenDraggingCard(null);
    };

    // Custom drop animation for DragOverlay
    const customDropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5'
                }
            }
        })
    };

    // Custom collision detection for dnd-kit
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
                // existing inner-card check...
                const checkColumn = orderedColumns.find((column) => column.id === overId);
                if (checkColumn) {
                    if (checkColumn?.cardOrderIds?.length > 0) {
                        const innerOver = closestCorners({
                            ...args,
                            droppableContainers: args.droppableContainers.filter(
                                (container) =>
                                    container.id !== overId &&
                                    checkColumn.cardOrderIds.includes(container.id)
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