import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'
import { mapOrder } from '~/utils/sorts'
import {
    DndContext,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    closestCorners,
    pointerWithin,
    getFirstCollision
} from '@dnd-kit/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import Column from './ListColumns/Column/Column'
import Card from './ListColumns/Column/ListCards/Card/Card'
import { cloneDeep } from 'lodash'

const ACTIVE_DRAG_ITEM_TYPE = {
    COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
    CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD'
}

function BoardContent({ board }) {
    // https://docs.dndkit.com/api-documentation/sensors
    // Nếu dùng PointerSensor mặc định thì phải kết hợp thuộc tính CSS touch-action: none ở trong phần tử kéo thả - nhưng mà còn bug

    // const pointerSensor = useSensor(PointerSensor, {
    //   activationConstraint: {
    //     distance: 10
    //   }
    // })

    // Yêu cầu chuột di chuyển 10px thì mới kích hoạt event, fix trường hợp click bị gọi event
    const mouseSensor = useSensor(MouseSensor, {
        activationConstraint: {
            distance: 10
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
    const [oldColumnWhenDraggingCard, setOldColumnWhenDraggingCard] = useState(null)

    // Điểm va chạm cuối cùng trước đó (xử lý thuật toán phát hiện va chạm, video 37)
    const lastOverId = useRef(null)

    useEffect(() => {
        setOrderedColumns(mapOrder(board?.columns, board?.columnOrderIds, 'id'))
    }, [board])

    // Tìm một cái Column theo CardId
    const findColumnByCardId = (cardId) => {
        // Đoạn này cần lưu ý, nên dùng c.cards thay vì c.cardOrderIds bởi vì ở bước handleDragOver chúng ta sẽ làm dữ liệu cho cards hoàn chỉnh trước rồi mới tạo ra cardOrderIds mới.
        return orderedColumns.find((column) => column?.cards?.map((card) => card.id)?.includes(cardId))
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
            // Tìm vị trí (index) của cái overCard trong column đích (nếu không tìm thấy -> -1)
            const overCardIndex = overColumn?.cards?.findIndex((card) => card.id === overCardId)

            // Logic tính toán "cardIndex mới":
            let newCardIndex
            if (overCardIndex >= 0) {
                const isBelowOverItem =
                    active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height
                const modifier = isBelowOverItem ? 1 : 0
                newCardIndex = overCardIndex + modifier
            } else {
                // Nếu overCardId không tồn tại (ví dụ: drop vào column rỗng) -> chèn vào cuối (append)
                newCardIndex = overColumn?.cards?.length ?? 0
            }

            const nextColumns = cloneDeep(prevColumns)
            const nextActiveColumn = nextColumns.find((column) => column.id === activeColumn.id)
            const nextOverColumn = nextColumns.find((column) => column.id === overColumn.id)

            if (nextActiveColumn) {
                nextActiveColumn.cards = nextActiveColumn.cards.filter((card) => card.id !== activeDraggingCardId)
                nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map((card) => card.id)
            }

            if (nextOverColumn) {
                nextOverColumn.cards = nextOverColumn.cards.filter((card) => card.id !== activeDraggingCardId)

                const rebuild_activeDraggingCardData = {
                    ...activeDraggingCardData,
                    columnId: nextOverColumn.id
                }

                nextOverColumn.cards = nextOverColumn.cards.toSpliced(newCardIndex, 0, rebuild_activeDraggingCardData)
                nextOverColumn.cardOrderIds = nextOverColumn.cards.map((card) => card.id)
            }

            return nextColumns
        })
    }

    // Trigger khi bắt đầu kéo (drap) một phần tử
    const handleDragStart = (event) => {
        setActiveDragItemId(event?.active?.id)
        setActiveDragItemType(
            event?.active?.data?.current?.columnId ? ACTIVE_DRAG_ITEM_TYPE.CARD : ACTIVE_DRAG_ITEM_TYPE.COLUMN
        )
        setActiveDragItemData(event?.active?.data?.current)

        // Nếu là kéo card thì mới thực hiện hành động set giá trị oldColumn
        if (event?.active?.data?.current?.columnId) {
            setOldColumnWhenDraggingCard(findColumnByCardId(event?.active?.id))
        }
    }

    // Trigger trong quá trình kéo (drag) một phần tử
    const handleDragOver = (event) => {
        if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return

        const { active, over } = event
        if (!active || !over) return

        const {
            id: activeDraggingCardId,
            data: { current: activeDraggingCardData }
        } = active

        // Detect nếu over là column hay là card
        let overColumn = null
        let overCardId = over.id

        const possibleColumn = orderedColumns.find((c) => c.id === over.id)
        if (possibleColumn) {
            overColumn = possibleColumn
            // Nếu column có card thì đặt overCardId là card gần nhất (ở đây ta không cần cụ thể card nào,
            // moveCardBetweenDifferentColumns đã xử lý overCardId không tồn tại -> append)
            overCardId = null
        } else {
            overColumn = findColumnByCardId(overCardId)
        }

        const activeColumn = findColumnByCardId(activeDraggingCardId)
        if (!activeColumn || !overColumn) return

        if (activeColumn.id !== overColumn.id) {
            moveCardBetweenDifferentColumns(
                overColumn,
                overCardId,
                active,
                over,
                activeColumn,
                activeDraggingCardId,
                activeDraggingCardData
            )
        }
    }

    // Trigger khi kết thúc hành động kéo một phần tử => hành động thả (drop)
    const handleDragEnd = (event) => {
        const { active, over } = event
        if (!active || !over) return

        if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
            const {
                id: activeDraggingCardId,
                data: { current: activeDraggingCardData }
            } = active

            // Nếu over là column id (ví dụ column rỗng) thì lấy column trực tiếp
            let overColumn = orderedColumns.find((c) => c.id === over.id)
            let overCardId = over.id

            if (!overColumn) {
                overColumn = findColumnByCardId(overCardId)
            } else {
                // over là column, không có card target -> overCardId = null
                overCardId = null
            }

            const activeColumn = findColumnByCardId(activeDraggingCardId)
            if (!activeColumn || !overColumn) return

            if (oldColumnWhenDraggingCard.id !== overColumn.id) {
                moveCardBetweenDifferentColumns(
                    overColumn,
                    overCardId,
                    active,
                    over,
                    activeColumn,
                    activeDraggingCardId,
                    activeDraggingCardData
                )
            } else {
                // same column reorder
                const oldCardIndex = oldColumnWhenDraggingCard?.cards?.findIndex((c) => c.id === activeDragItemId)

                // Nếu overCardId === null (thả vào chính column nhưng không vào 1 card cụ thể) -> đưa xuống cuối
                let newCardIndex = overCardId ? overColumn?.cards?.findIndex((c) => c.id === overCardId) : oldColumnWhenDraggingCard?.cards?.length - 1
                if (newCardIndex < 0) newCardIndex = oldColumnWhenDraggingCard?.cards?.length - 1

                const dndOrderedCards = arrayMove(oldColumnWhenDraggingCard?.cards, oldCardIndex, newCardIndex)

                setOrderedColumns((prevColumns) => {
                    const nextColumns = cloneDeep(prevColumns)
                    const targetColumn = nextColumns.find((column) => column.id === overColumn.id)
                    targetColumn.cards = dndOrderedCards
                    targetColumn.cardOrderIds = dndOrderedCards.map((card) => card.id)
                    return nextColumns
                })
            }
        }

        // xử lý column drag như trước...
        if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
            if (active.id !== over.id) {
                const oldColumnIndex = orderedColumns.findIndex((c) => c.id === active.id)
                const newColumnIndex = orderedColumns.findIndex((c) => c.id === over.id)
                const dndOrderedColumns = arrayMove(orderedColumns, oldColumnIndex, newColumnIndex)
                setOrderedColumns(dndOrderedColumns)
            }
        }

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

    // Chúng ta sẽ custom lại chiến lược / thuật toán phát hiện va chạm tối ưu cho việc kéo thả card giữa nhiều columns (video 37 fix bug quan trọng)
    //  args = arguments = Các đối số, tham số
    const collisionDetectionStrategy = useCallback(
        (args) => {
            if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
                return closestCorners({ ...args })
            }

            const pointerIntersections = pointerWithin(args)
            if (!pointerIntersections?.length) return

            let overId = getFirstCollision(pointerIntersections, 'id')
            if (overId) {
                // Nếu overId là column id thì xử lý đặc biệt
                const checkColumn = orderedColumns.find((column) => column.id === overId)
                if (checkColumn) {
                    // Tìm card gần nhất bên trong column (nếu có)
                    const candidate = closestCorners({
                        ...args,
                        droppableContainers: args.droppableContainers.filter((container) => {
                            return container.id !== overId && checkColumn?.cardOrderIds?.includes(container.id)
                        })
                    })[0]?.id

                    // Nếu tìm được card gần nhất thì dùng card đó, còn không (column rỗng) -> dùng chính column.id
                    overId = candidate ?? checkColumn.id
                }

                if (overId) {
                    lastOverId.current = overId
                    return [{ id: overId }]
                }
            }

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
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'),
                    width: '100%',
                    height: (theme) => theme.custom.boardContentHeight,
                    p: '10px 0'
                }}
            >
                <ListColumns columns={orderedColumns} />
                <DragOverlay dropAnimation={customDropAnimation}>
                    {!activeDragItemType && null}
                    {activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN && <Column column={activeDragItemData} />}
                    {activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD && <Card card={activeDragItemData} />}
                </DragOverlay>
            </Box>
        </DndContext>
    )
}

export default BoardContent