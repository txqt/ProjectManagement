import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'
import { mapOrder } from '~/utils/sorts'
import { MouseSensor, TouchSensor } from '~/customLibraries/DndKitSensors'
import {
    DndContext,
    // MouseSensor,
    // TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    closestCorners,
    pointerWithin,
    getFirstCollision
} from '@dnd-kit/core'
import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import Column from './ListColumns/Column/Column'
import Card from './ListColumns/Column/ListCards/Card/Card'
import { cloneDeep, throttle } from 'lodash'
import { ACTIVE_DRAG_ITEM_TYPE } from '~/utils/contants'

function BoardContent({ board, createColumn, createCard, deleteColumn, reorderColumns, reorderCards, moveCard }) {
    // https://docs.dndkit.com/api-documentation/sensors
    // Nếu dùng PointerSensor mặc định thì phải kết hợp thuộc tính CSS touch-action: none ở trong phần tử kéo thả - nhưng mà còn bug

    // const pointerSensor = useSensor(PointerSensor, {
    //   activationConstraint: {
    //     distance: 10
    //   }
    // })

    // Yêu cầu chuột di chuyển 5px thì mới kích hoạt event, fix trường hợp click bị gọi event
    const mouseSensor = useSensor(MouseSensor, {
        activationConstraint: {
            distance: 5
        }
    })

    // Nhấn giữ 250ms (delay) và dung sai (tolerance) của cảm ứng 500px (dễ hiểu là di chuyển/chênh lệch 5px) thì mới kích hoạt event
    const touchSensor = useSensor(TouchSensor, {
        activationConstraint: {
            delay: 250,
            tolerance: 500
        }
    })

    // Ưu tiên sử dụng kết hợp 2 loại sensors là mouse và touch để có trải nghiệm trên mobile tốt nhất, không bị bug
    // const sensors = useSensors(pointerSensor)
    const sensors = useSensors(mouseSensor, touchSensor)

    const [orderedColumns, setOrderedColumns] = useState([])

    // Cùng một thời điểm chỉ có một phần tử đang được kéo (column hoặc card)
    const [activeDragItemId, setActiveDragItemId] = useState(null)
    const [activeDragItemType, setActiveDragItemType] = useState(null)
    const [activeDragItemData, setActiveDragItemData] = useState(null)
    const [oldColumnWhenDraggingCard, setOldColumnWhenDraggingCard] =
        useState(null)

    // Điểm va chạm cuối cùng trước đó (xử lý thuật toán phát hiện va chạm, video 37)
    const lastOverId = useRef(null)

    useEffect(() => {
        setOrderedColumns(mapOrder(board?.columns, board?.columnOrderIds, 'id'))
    }, [board])

    const findColumnByCardId = (cardOrColumnId) => {
        return orderedColumns.find((column) =>
            column.id === cardOrColumnId ||
            column?.cards?.map((card) => card.id)?.includes(cardOrColumnId)
        )
    }

    // Function chung xử lý việc cập nhật lại state trong trường hợp di chuyển Card giữa các Column khác nhau
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
            // Tìm vị trí (index) của cái overCard trong column đích (nơi activeCard sắp được thả)
            const overCardIndex = overColumn?.cards?.findIndex(
                (card) => card.id === overCardId
            )

            // Logic tính toán "cardIndex mới" (trên hoặc dưới overCard) lấy chuẩn ra từ code của thư viện - nhiều khi muốn từ chối hiểu =))
            let newCardIndex
            const isBelowOverItem =
                active.rect.current.translated &&
                active.rect.current.translated.top > over.rect.top + over.rect.height

            const modifier = isBelowOverItem ? 1 : 0

            newCardIndex =
                overCardIndex >= 0
                    ? overCardIndex + modifier
                    : overColumn?.cards?.length

            // Clone mảng OrderedColumnsState cũ ra một cái mới để xử lý data rồi return - cập nhật lại OrderedColumnsState mới
            const nextColumns = cloneDeep(prevColumns)
            const nextActiveColumn = nextColumns.find(
                (column) => column.id === activeColumn.id
            )
            const nextOverColumn = nextColumns.find(
                (column) => column.id === overColumn.id
            )

            // nextActiveColumn: Column cũ
            if (nextActiveColumn) {
                // Xoá card ở cái column active (cũng có thể là column cũ, cái lúc mà kéo card ra khỏi nó để sang column khác)
                nextActiveColumn.cards = nextActiveColumn.cards.filter(
                    (card) => card.id !== activeDraggingCardId
                )

                // Cập nhật lại mảng cardOrderIds cho chuẩn dữ liệu
                nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(
                    (card) => card.id
                )
            }

            // nextOverColumn: Column mới
            if (nextOverColumn) {
                // Kiểm tra xem cái card đang kéo nó có tồn tại ở overColumn chưa, nếu có thì cần xoá nó trước
                nextOverColumn.cards = nextOverColumn.cards.filter(
                    (card) => card.id !== activeDraggingCardId
                )

                // Phải cập nhật lại chuẩn dữ liệu columnId trong card sau khi kéo card giữa 2 column khác nhau
                const rebuild_activeDraggingCardData = {
                    ...activeDraggingCardData,
                    columnId: nextOverColumn.id
                }

                // Tiếp theo là thêm cái card đang kéo vào overColumn theo vị trí index mới
                nextOverColumn.cards = nextOverColumn.cards.toSpliced(
                    newCardIndex,
                    0,
                    rebuild_activeDraggingCardData
                )

                // Xoá cái Placeholder Card đi nếu nó đang tồn tại (Video 37.2)
                nextOverColumn.cards = nextOverColumn.cards.filter(
                    (card) => !card.FE_PlaceholderCard
                )

                // Cập nhật lại mảng cardOrderIds cho chuẩn dữ liệu
                nextOverColumn.cardOrderIds = nextOverColumn.cards.map(
                    (card) => card.id
                )
            }

            return nextColumns
        })
    }

    // Trigger khi bắt đầu kéo (drap) một phần tử
    const handleDragStart = (event) => {
        setActiveDragItemId(event?.active?.id)
        setActiveDragItemType(
            event?.active?.data?.current?.columnId
                ? ACTIVE_DRAG_ITEM_TYPE.CARD
                : ACTIVE_DRAG_ITEM_TYPE.COLUMN
        )
        setActiveDragItemData(event?.active?.data?.current)

        // Nếu là kéo card thì mới thực hiện hành động set giá trị oldColumn
        if (event?.active?.data?.current?.columnId) {
            setOldColumnWhenDraggingCard(findColumnByCardId(event?.active?.id))
        }
    }

    // Trigger trong quá trình kéo (drag) một phần tử
    const handleDragOver = useMemo(() =>
        throttle((event) => {
            // Không làm gì thêm nếu đang kéo Column
            if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return;

            // Còn nếu kéo card thì xử lý thêm để có thể kéo card qua lại giữa các columns
            // console.log('handleDragOver', event)
            const { active, over } = event;

            // Cần đảm bảo nếu không tồn tại active hoặc over (khi kéo ra khỏi phạm vi container) thì không làm gì (tránh crash trang)
            if (!active || !over) return;

            // activeDraggingCard: Là cái card đang được kéo
            const {
                id: activeDraggingCardId,
                // data: { current: activeDraggingCardData }
            } = active;

            // overCard: là cái card đang tương tác trên hoặc dưới so với cái card được kéo ở trên
            const { id: overCardId } = over;

            // Tìm 2 cái column theo cái cardId
            const activeColumn = findColumnByCardId(activeDraggingCardId);
            const overColumn = findColumnByCardId(overCardId);

            // Nếu không tồn tại 1 trong 2 column thì không làm gì hết, tránh crash trang web
            if (!activeColumn || !overColumn) return;

            // Xử lý logic ở đây chỉ khi kéo card qua 2 column khác nhau, còn nếu kéo card trong chính column ban đầu của nó thì không làm gì
            // Vì đây đang làm đoạn xử lý lúc kéo (handleDragOver), còn xử lý lúc kéo xong xuôi thì nó lại là vấn đề khác ở (handleDragEnd)
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
        }, 16), // ~60fps
        [activeDragItemType, orderedColumns]
    );

    // Trigger khi kết thúc hành động kéo một phần tử => hành động thả (drop)
    const handleDragEnd = async (event) => {
        const { active, over } = event

        // Cần đảm bảo nếu không tồn tại active hoặc over (khi kéo ra khỏi phạm vi container) thì không làm gì (tránh crash trang)
        if (!active || !over) return

        const prevOrdered = cloneDeep(orderedColumns);

        // Xử lý kéo thả Cards
        if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
            // activeDraggingCard: Là cái card đang được kéo
            const {
                id: activeDraggingCardId,
                data: { current: activeDraggingCardData }
            } = active

            // overCard: là cái card đang tương tác trên hoặc dưới so với cái card được kéo ở trên
            const { id: overCardId } = over

            // Tìm 2 cái column theo cái cardId
            const activeColumn = findColumnByCardId(activeDraggingCardId)
            const overColumn = findColumnByCardId(overCardId)

            // Nếu không tồn tại 1 trong 2 column thì không làm gì hết, tránh crash trang web
            if (!activeColumn || !overColumn) return

            // Hành động kéo thả card giữa 2 column khác nhau
            // Phải dùng tới activeDragItemData.columnId hoặc oldColumnWhenDraggingCard.id (set vào state từ bước handleDragStart) chứ không phải activeData trong scope handleDragEnd này vì sau khi đi qua onDragOver tới đây là state của card đã bị cập nhật một lần rồi
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

                // tính index mới
                const overCardIndex = overColumn?.cards?.findIndex(c => c.id === overCardId);
                const isBelowOverItem =
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;
                const modifier = isBelowOverItem ? 1 : 0;
                const newIndex = overCardIndex >= 0 ? overCardIndex + modifier : (overColumn?.cards?.length ?? 0);

                // gọi API
                try {
                    await moveCard(oldColumnWhenDraggingCard.id, overColumn.id, activeDraggingCardId, newIndex);
                } catch (err) {
                    console.error("moveCard API error", err);
                    setOrderedColumns(prevOrdered);
                }
            } else {
                // Hành động kéo thả card trong cùng 1 cái column

                // Lấy vị trí cũ (từ thằng oldColumnWhenDraggingCard)
                const oldCardIndex = oldColumnWhenDraggingCard?.cards?.findIndex(
                    (c) => c.id === activeDragItemId
                )
                // Lấy vị trí cũ (từ thằng over)
                const newCardIndex = overColumn?.cards?.findIndex(
                    (c) => c.id === overCardId
                )

                // Dùng arrayMove vì kéo card trong một cái column thì tương tự với logic kéo column trong một cái board content
                const dndOrderedCards = arrayMove(
                    oldColumnWhenDraggingCard?.cards,
                    oldCardIndex,
                    newCardIndex
                )

                setOrderedColumns((prevColumns) => {
                    // Clone mảng OrderedColumnsState cũ ra một cái mới để xử lý data rồi return - cập nhật lại OrderedColumnsState mới
                    const nextColumns = cloneDeep(prevColumns)

                    // Tìm tới Column mà chúng ta đang thả
                    const targetColumn = nextColumns.find(
                        (column) => column.id === overColumn.id
                    )

                    // Cập nhật lại 2 giá trị mới là card và cardOrderIds trong cái targetColumn
                    targetColumn.cards = dndOrderedCards
                    targetColumn.cardOrderIds = dndOrderedCards.map((card) => card.id)

                    // Trả về giá trị state mới (chuẩn vị trí)
                    return nextColumns
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

        // Xử lý kéo thả Columns trong một cái boardContent
        // Xử lý kéo thả Columns - phần có lỗi cần sửa
        if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
            if (active.id !== over.id) {
                const oldColumnIndex = orderedColumns.findIndex((c) => c.id === active.id)
                const newColumnIndex = orderedColumns.findIndex((c) => c.id === over.id)

                const dndOrderedColumns = arrayMove(orderedColumns, oldColumnIndex, newColumnIndex)

                // Cập nhật state columns ban đầu sau khi đã kéo thả
                setOrderedColumns(dndOrderedColumns)

                try {
                    await reorderColumns(dndOrderedColumns.map((column) => column.id));
                } catch (error) {
                    // Phải xử lý lỗi và rollback state
                    console.error("reorderColumns API error", error);
                    setOrderedColumns(prevOrdered);
                }
            }
        }

        // Những hành động sau khi kéo thả này luôn phải đưa về giá trị null mặc định ban đầu
        setActiveDragItemId(null)
        setActiveDragItemType(null)
        setActiveDragItemData(null)
        setOldColumnWhenDraggingCard(null)
    }

    /**
     * Animation khi thả (Drop) phần tử - Test bằng cách kéo xong thả trực tiếp và nhìn phần giữ chỗ Overlay (video 32)
     */
    const customDropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5'
                }
            }
        })
    }

    const collisionDetectionStrategy = useCallback(
        // Trường hợp kéo column thì dùng thuật toán closestCorners là chuẩn nhất
        (args) => {
            if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
                return closestCorners({ ...args })
            }

            // Tìm các điểm giao nhau, va chạm, trả về một mảng các va chạm - intersections với con trỏ
            const pointerIntersections = pointerWithin(args)

            // Video 37.1: Nếu pointerIntersections là mảng rỗng, return luôn không làm gì hết
            // Fix triệt để cái bug flickering của thư viện Dnd-kit trong trường hợp sau:
            // - Kéo một cái card có image cover lớn và kéo lên phía trên cùng ra khỏi khu vực kéo thả
            if (!pointerIntersections?.length) return

            // Thuật toán phát hiện va chạm sẽ trả về một mảng các va chạm ở đây (không cần bước này nữa - video 37.1)
            // const intersections = !!pointerIntersections?.length ? pointerIntersections : rectIntersection(args)

            // Tìm overId đầu tiên trong đám intersection ở trên
            let overId = getFirstCollision(pointerIntersections, 'id')
            if (overId) {
                // Video 37: Đoạn này để fix cái vụ flickering nhé
                // Nếu cái over nó là column thì sẽ tìm tới cái cardId gần nhất bên trong khu vực va chạm đó dựa vào thuật toán phát hiện va chạm closestCenter hoặc closestCorners đều được. Tuy nhiên ở đây dùng closestCorners mình thấy mượt mà hơn
                const checkColumn = orderedColumns.find(
                    (column) => column.id === overId
                )
                if (checkColumn) {
                    // Nếu column có cardOrderIds => tìm card gần nhất bên trong column
                    if (checkColumn?.cardOrderIds?.length) {
                        const innerOver = closestCorners({
                            ...args,
                            droppableContainers: args.droppableContainers.filter(
                                (container) =>
                                    container.id !== overId &&
                                    checkColumn.cardOrderIds.includes(container.id)
                            )
                        })[0]?.id

                        // nếu tìm được innerOver thì dùng nó, không thì fallback giữ overId = column.id
                        if (innerOver) {
                            overId = innerOver
                        } else {
                            // column có cardOrderIds nhưng không tìm được inner => giữ nguyên overId (column)
                        }
                    } else {
                        // column rỗng: giữ overId là column.id để xử lý chèn ở cuối
                    }
                }

                lastOverId.current = overId
                return [{ id: overId }]

            }

            // Nếu overId là null thì trả về mảng rỗng - tránh bug crash trang
            return lastOverId.current ? [{ id: lastOverId.current }] : []
        },
        [activeDragItemType, orderedColumns]
    )

    return (
        <DndContext
            // Cảm biến (đã giải thích kỹ ở video số 30)
            sensors={sensors}
            // Thuật toán phát hiện va chạm (nếu không có nó thì card với cover lớn sẽ không kéo qua Column được vì lúc này nó đang bị conflict giữa card và column), chúng ta sẽ dùng closestCorners thay vì closestCenter
            // https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms
            // Update video 37: nếu chỉ dùng closestCorners sẽ có bug flickering + sai lệch dữ liệu (vui lòng xem video 37 sẽ rõ)
            // collisionDetection={closestCorners}

            // Tự custom nâng cao thuật toán phát hiện va chạm (video fix bug số 37)
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
                <ListColumns columns={orderedColumns} createColumn={createColumn} createCard={createCard} deleteColumn={deleteColumn} />
                <DragOverlay dropAnimation={customDropAnimation}>
                    {!activeDragItemType && null}
                    {activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN && (
                        <Column column={activeDragItemData} />
                    )}
                    {activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD && (
                        <Card card={activeDragItemData} />
                    )}
                </DragOverlay>
            </Box>
        </DndContext>
    )
}

export default BoardContent