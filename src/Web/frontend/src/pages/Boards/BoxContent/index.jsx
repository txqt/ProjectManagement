import { Box } from "@mui/material";

function BoardContent() {
    return (
        <Box
            sx={(theme) => ({
                backgroundColor: "primary.main",
                width: "100%",
                height: `calc(100vh - ${theme.custom.appBarHeight} - ${theme.custom.boardBarHeight})`,
                display: "flex",
                alignItems: "center",
            })}
        >
            Board Content
        </Box>
    )
}

export default BoardContent