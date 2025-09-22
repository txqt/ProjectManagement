import { Box } from "@mui/material";
import ListColumns from "./ListColumns/ListColumns";
import { sortByOrder } from "~/utils/sorts";

function BoardContent({ board }) {
    const orderedColumns = sortByOrder(board?.columns, board?.columnOrderIds, 'id');
    return (
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
    )
}

export default BoardContent