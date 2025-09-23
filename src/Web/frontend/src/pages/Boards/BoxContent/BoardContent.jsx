import { Box } from "@mui/material";
import ListColumns from "./ListColumns/ListColumns";
import { sortByOrder } from "~/utils/sorts";
import { DndContext, useSensor, useSensors, MouseSensor, TouchSensor, DragOverlay, defaultDropAnimationSideEffects, closestCorners, closestCenter, pointerWithin, getFirstCollision } from '@dnd-kit/core';
import { useState, useCallback } from "react";
import { useEffect } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import Column from "./ListColumns/Column/Column";
import Card from "./ListColumns/Column/ListCards/Card/Card";
import { cloneDeep } from "lodash";
import { useRef } from "react";

const ACTIVE_DRAG_ITEM_TYPE = {
    COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
    CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD'
}

function BoardContent({ board }) {
    //mouse must move 10px
    const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 5 } });

    //(mobile) press delay 250ms, with tolerance of 5px of movement
    const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } });

    // const sensors = useSensors(pointerSensor);
    const sensors = useSensors(mouseSensor, touchSensor);

    const [orderedColumns, setOrderedColumns] = useState([]);

    //only 1 item can be dragged and dropped at a time (column or card)
    const [activeDragItemId, setActiveDragItemId] = useState(null);
    const [activeDragItemType, setActiveDragItemType] = useState(null);
    const [activeDragItemData, setActiveDragItemData] = useState(null);
    const [oldColumnWhenDraggingCard, setOldColumnWhenDraggingCard] = useState(null);
    const lastOverId = useRef(null);

    useEffect(() => {
        setOrderedColumns(sortByOrder(board?.columns, board?.columnOrderIds, 'id'));
    }, [board])

    const findColumnByCardId = (cardId) => {
        return orderedColumns.find(column => column?.cards?.map(card => card.id)?.includes(cardId))
    }

    const handleDragStart = (e) => {
        setActiveDragItemId(e?.active?.id);
        setActiveDragItemType(e?.active?.data?.current?.columnId ? ACTIVE_DRAG_ITEM_TYPE.CARD : ACTIVE_DRAG_ITEM_TYPE.COLUMN);
        setActiveDragItemData(e?.active?.data?.current);

        if (e?.active?.data?.current?.columnId) {
            setOldColumnWhenDraggingCard(findColumnByCardId(e?.active?.id))
        }
    }

    const moveCardBetweenDifferentColumns = (
        overColumn,
        overCardId,
        active,
        over,
        activeColumn,
        activeDraggingCardId,
        activeDraggingCardData
    ) => {
        setOrderedColumns(prevColumns => {
            // Tạo một deep copy của columns để tránh mutate trực tiếp
            const nextColumns = cloneDeep(prevColumns);

            // Tìm các columns trong bản copy
            const nextActiveColumn = nextColumns.find(column => column.id === activeColumn.id);
            const nextOverColumn = nextColumns.find(column => column.id === overColumn.id);

            if (!nextActiveColumn || !nextOverColumn) {
                return prevColumns; // Trả về state cũ nếu không tìm thấy column
            }

            // Tính toán vị trí mới cho card
            const overCardIndex = nextOverColumn.cards?.findIndex(card => card.id === overCardId);

            let newCardIndex;
            const isBelowOverItem =
                over &&
                active.rect.current.translated &&
                active.rect.current.translated.top >
                over.rect.top + over.rect.height;

            const modifier = isBelowOverItem ? 1 : 0;
            newCardIndex = overCardIndex >= 0 ? overCardIndex + modifier : nextOverColumn.cards?.length || 0;

            // Xóa card khỏi column cũ
            nextActiveColumn.cards = nextActiveColumn.cards.filter(card => card.id !== activeDraggingCardId);
            nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(card => card.id);

            // Thêm card vào column mới
            const cardToMove = {
                ...activeDraggingCardData,
                columnId: nextOverColumn.id
            };

            nextOverColumn.cards = nextOverColumn.cards.filter(card => card.id !== activeDraggingCardId);
            nextOverColumn.cards.splice(newCardIndex, 0, cardToMove);
            nextOverColumn.cardOrderIds = nextOverColumn.cards.map(card => card.id);

            return nextColumns;
        })
    }

    const handleDragOver = (e) => {
        // Chỉ xử lý drag over cho cards
        if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
            return;
        }

        const { active, over } = e;

        if (!active || !over) return;

        const { id: activeDraggingCardId, data: { current: activeDraggingCardData } } = active;
        const { id: overCardId } = over;

        const activeColumn = findColumnByCardId(activeDraggingCardId);
        const overColumn = findColumnByCardId(overCardId);

        if (!activeColumn || !overColumn) {
            return;
        }

        // Chỉ di chuyển khi card được kéo sang column khác
        if (activeColumn.id !== overColumn.id) {
            // moveCardBetweenDifferentColumns(
            //     overColumn,
            //     overCardId,
            //     active,
            //     over,
            //     activeColumn,
            //     activeDraggingCardId,
            //     activeDraggingCardData
            // )
        }
    }

    const handleDragEnd = (e) => {
        const { active, over } = e;

        if (!active || !over) return;

        if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
            const { id: activeDraggingCardId, data: { current: activeDraggingCardData } } = active;
            const { id: overCardId } = over;

            const activeColumn = findColumnByCardId(activeDraggingCardId);
            const overColumn = findColumnByCardId(overCardId);

            if (!activeColumn || !overColumn) {
                return;
            }

            // Kiểm tra xem có phải di chuyển giữa các column khác nhau không
            if (oldColumnWhenDraggingCard && oldColumnWhenDraggingCard.id !== overColumn.id) {
                // Di chuyển giữa các column khác nhau - đã được xử lý trong handleDragOver
                // Không cần làm gì thêm ở đây
            } else {
                // Di chuyển trong cùng một column
                const oldCardIndex = oldColumnWhenDraggingCard?.cards?.findIndex(c => c.id === activeDragItemId);
                const newCardIndex = overColumn?.cards?.findIndex(c => c.id === overCardId);

                if (oldCardIndex !== undefined && newCardIndex !== undefined && oldCardIndex !== newCardIndex) {
                    const dndOrderedCards = arrayMove(overColumn.cards, oldCardIndex, newCardIndex);

                    setOrderedColumns(prevColumns => {
                        const nextColumns = cloneDeep(prevColumns);
                        const targetColumn = nextColumns.find(c => c.id === overColumn.id);

                        if (targetColumn) {
                            targetColumn.cards = dndOrderedCards;
                            targetColumn.cardOrderIds = dndOrderedCards.map(card => card.id);
                        }

                        return nextColumns;
                    });
                }
            }
        }

        if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
            if (active.id !== over.id) {
                //get old position from active
                const oldColumnIndex = orderedColumns.findIndex(c => c.id === active.id);
                //get new position from over
                const newColumnIndex = orderedColumns.findIndex(c => c.id === over.id);

                if (oldColumnIndex !== -1 && newColumnIndex !== -1) {
                    const dndOrderedColumns = arrayMove(orderedColumns, oldColumnIndex, newColumnIndex);
                    setOrderedColumns(dndOrderedColumns);
                }
            }
        }

        // Reset drag states
        setActiveDragItemId(null);
        setActiveDragItemType(null);
        setActiveDragItemData(null);
        setOldColumnWhenDraggingCard(null);
    }

    const customDropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5'
                }
            }
        })
    }

    const collisionDetectionStrategy = useCallback((args) => {
        // Nếu kéo column thì dùng closestCorners bình thường
        if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
            return closestCenter(args);
        }

        // Dành cho card: ưu tiên pointerWithin (trả về mảng collisions)
        const pointerIntersections = pointerWithin(args);

        if (!pointerIntersections || !pointerIntersections.length) {
            // nếu không có va chạm với con trỏ thì trả về empty
            return lastOverId.current ? [{ id: lastOverId.current }] : [];
        }

        // Lấy collision đầu tiên
        const firstPointerCollision = getFirstCollision(pointerIntersections);
        const initialOverId = firstPointerCollision?.id;
        if (!initialOverId) {
            return lastOverId.current ? [{ id: lastOverId.current }] : [];
        }

        let overId = initialOverId;
        const checkColumn = orderedColumns.find(column => column.id === overId);

        if (checkColumn) {
            // lọc danh sách droppable containers sao cho không phải column chính nó
            // và chỉ lấy các container là card trong column đó (theo cardOrderIds)
            const candidates = args.droppableContainers.filter(container => {
                return container.id !== overId && checkColumn?.cardOrderIds?.includes(container.id);
            });

            if (candidates.length > 0) {
                // gọi closestCorners đúng cách: truyền args nhưng thay droppableContainers bằng mảng candidates
                const collisionsFromCandidates = closestCenter({
                    ...args,
                    droppableContainers: candidates
                });

                // lấy kết quả đầu tiên từ collisions mới
                const first = getFirstCollision(collisionsFromCandidates);
                if (first?.id) {
                    overId = first.id;
                }
            }
        }

        lastOverId.current = overId;
        return [{ id: overId }];
    }, [activeDragItemType, orderedColumns]);


    return (
        <DndContext
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            collisionDetection={collisionDetectionStrategy}>
            <Box
                sx={(theme) => ({
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976b2'),
                    width: "100%",
                    height: theme.custom.boardContentHeight,
                    p: '10px 0'
                })}
            >
                <ListColumns columns={orderedColumns} />
                <DragOverlay dropAnimation={customDropAnimation}>
                    {!activeDragItemType && null}
                    {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) && <Column column={activeDragItemData} />}
                    {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) && <Card card={activeDragItemData} />}
                </DragOverlay>
            </Box>
        </DndContext>
    )
}

export default BoardContent