import Box from '@mui/material/Box'
import Card from './Card/Card'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

function ListCards({ cards }) {
    return (
        <SortableContext
            items={cards?.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
        >
            <Box
                sx={{
                    p: '0 5px 5px 5px', // padding
                    m: '0 5px', // margin
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    overflowX: 'hidden',
                    overflowY: 'auto',
                    maxHeight: (theme) => `calc(
                    ${theme.custom.boardContentHeight} -
                    ${theme.spacing(5)} -
                    ${theme.custom.columnHeaderHeight} -
                    ${theme.custom.columnFooterHeight}
                    )`,
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#ced0da' },
                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#dfc2cf' }
                }}
            >
                {cards?.map((card) => (
                    <Card key={card.id} card={card} />
                ))}
            </Box>
        </SortableContext>
    )
}

export default ListCards