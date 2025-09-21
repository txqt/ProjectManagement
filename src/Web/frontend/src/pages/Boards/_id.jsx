import { Box, Container } from "@mui/material";
import AppBar from "../../components/AppBar"
import BoardBar from "./BoardBar";
import BoardContent from "./BoxContent";

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