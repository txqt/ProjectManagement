import { Box } from "@mui/material";
import ListColumns from "./ListColumns/ListColumns";
import { sortByOrder } from "~/utils/sorts";
import { DndContext, PointerSensor, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { useState } from "react";
import { useEffect } from "react";
import { arrayMove } from "@dnd-kit/sortable";

function BoardContent({ board }) {//mouse must move 10px
    const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 10 } });

    //(mobile) press delay 250ms, with tolerance of 500px of movement
    const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 500 } });

    // const sensors = useSensors(pointerSensor);
    const sensors = useSensors(mouseSensor, touchSensor);

    const [orderedColumns, setOrderedColumns] = useState([]);

    useEffect(() => {
        setOrderedColumns(sortByOrder(board?.columns, board?.columnOrderIds, 'id'));
    }, [board])

    const handleDragEnd = (e) => {
        const { active, over } = e;
        console.log(e)
        if (!over) return;

        if (active.id !== over.id) {
            //get old position from active
            const oldIndex = orderedColumns.findIndex(c => c.id === active.id);

            //get new position from over
            const newIndex = orderedColumns.findIndex(c => c.id === over.id);

            const dndOrderedColumns = arrayMove(orderedColumns, oldIndex, newIndex);

            // const dndOrderedColumnIds = dndOrderedColumns.map(c => c.id);
            // console.log('dndOrderedColumns', dndOrderedColumns);

            setOrderedColumns(dndOrderedColumns);
        }
    }
    return (
        <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
            <Box
                sx={(theme) => ({
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976b2'),
                    width: "100%",
                    height: theme.custom.boardContentHeight,
                    p: '10px 0'
                })}
            >
                <ListColumns columns={orderedColumns} />
            </Box>
        </DndContext>
    )
}

export default BoardContent