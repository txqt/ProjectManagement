import Box from '@mui/material/Box'
import { useEffect, useState } from 'react'
import { mapOrder } from '~/utils/sorts'
import ListColumns from './ListColumns/ListColumns'

function BoardContent({ board, createColumn, createCard, deleteColumn, reorderColumns, reorderCards, moveCard, deleteCard, pendingTempIds }) {

    const [orderedColumns, setOrderedColumns] = useState([])

    useEffect(() => {
        setOrderedColumns(mapOrder(board?.columns, board?.columnOrderIds, 'id'))
    }, [board])
    return (
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
                createCard={createCard}
                deleteColumn={deleteColumn}
                deleteCard={deleteCard}
                pendingTempIds={pendingTempIds} />
        </Box>
    )
}

export default BoardContent