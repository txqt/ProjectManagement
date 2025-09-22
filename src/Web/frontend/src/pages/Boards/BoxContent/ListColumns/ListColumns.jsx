import React from 'react'
import { Box, Button } from "@mui/material";
import Column from './Column/Column'
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

function ListColumns({ columns }) {

    return (
        <SortableContext items={columns?.map(c => c.id)} strategy={horizontalListSortingStrategy}>
            <Box sx={{
                bgcolor: 'inherit',
                width: '100%',
                height: '100%',
                display: "flex",
                overflowX: 'auto',
                overflowY: 'hidden',
                '&::-webkit-scrollbar-track': {
                    m: 2
                }
            }}>
                {columns?.map((column) => {
                    return (<Column key={column.id} column={column} />)
                })}

                <Box sx={{
                    minWidth: '200px',
                    maxWidth: '200px',
                    mx: 2,
                    borderRadius: '6px',
                    height: 'fit-content',
                    bgcolor: '#ffffff3d'
                }}>
                    <Button
                        startIcon={<NoteAddIcon />}
                        sx={{
                            color: 'white',
                            width: '100%',
                            justifyContent: 'flex-start',
                            pl: 2.5,
                            py: 1
                        }}
                    >
                        Add new column
                    </Button>
                </Box>
            </Box>
        </SortableContext>
    )
}

export default ListColumns