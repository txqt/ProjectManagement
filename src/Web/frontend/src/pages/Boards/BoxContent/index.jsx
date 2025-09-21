import { Box } from "@mui/material";

function BoardContent() {
    return (
        <Box
            sx={(theme) => ({
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976b2'),
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