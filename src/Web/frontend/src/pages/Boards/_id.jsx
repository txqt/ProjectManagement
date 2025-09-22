import { Box, Container } from "@mui/material";
import AppBar from "~/components/AppBar/AppBar"
import BoardBar from "./BoardBar/BoardBar";
import BoardContent from "./BoxContent/BoardContent";
import { mockData } from "~/apis/mock-data";

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
            <BoardBar board={mockData?.board}/>

            {/* Board Content */}
            <BoardContent board={mockData?.board}/>
            
        </Container>
    );
}

export default Board