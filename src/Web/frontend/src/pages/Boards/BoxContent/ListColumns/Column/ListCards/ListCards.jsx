import React from 'react'
import { Box } from "@mui/material";
import Card from './Card/Card';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function ListCards({ cards }) {
    return (
        <SortableContext items={cards?.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <Box sx={{
                p: '0 5px',
                m: '0 5px',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                overflowX: 'hidden',
                overflowY: 'auto',
                maxHeight: (theme) => `calc(
                    ${theme.custom.boardContentHeight} - 
                    ${theme.spacing(5)} -
                    ${(theme) => (theme.custom.columnHeaderHeight)} -
                    ${(theme) => (theme.custom.columnFooterHeight)}
                    )`,
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#ced0da'
                }
                ,
                '&::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: '#bfc2cf'
                }
            }}
            >
                {cards?.map((card) => {
                    return (<Card key={card.id} card={card} />)
                })}
            </Box>
        </SortableContext>
    )
}

export default ListCards