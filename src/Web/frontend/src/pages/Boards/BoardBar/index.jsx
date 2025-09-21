import { Box } from "@mui/material";

function BoardBar() {
    return (
        <Box
            sx={(theme) => ({
                backgroundColor: "primary.dark",
                width: "100%",
                height: theme.custom.boardBarHeight,
                display: "flex",
                alignItems: "center",
            })}
        >
            Board Bar
        </Box>
    )
}

export default BoardBar