import { Box, Container } from "@mui/material";
import AppBar from "~/components/AppBar/AppBar"
import BoardBar from "./BoardBar/BoardBar";
import BoardContent from "./BoxContent/BoardContent";

function Board() {
    return (
        <Container
            disableGutters
            maxWidth={false}
            sx={{
                height: "100vh",
            }}
        >
            {/* AppBar */}
            <AppBar />

            {/* BoardBar */}
            <BoardBar />

            {/* Board Content */}
            <BoardContent />
            
        </Container>
    );
}

export default Board