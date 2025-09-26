import { Box, Container, CircularProgress, Alert } from "@mui/material";
import { useParams } from 'react-router-dom';
import AppBar from "~/components/AppBar/AppBar";
import BoardBar from "./BoardBar/BoardBar";
import BoardContent from "./BoxContent/BoardContent";
import { useBoard } from "~/hooks/useBoard";

function Board() {
    const { boardId } = useParams();
    const { board, error, createColumn, createCard, deleteColumn, reorderColumns, reorderCards, moveCard } = useBoard(boardId);

    if (error) {
        return (
            <Container
                disableGutters
                maxWidth={false}
                sx={{ height: "100vh" }}
            >
                <AppBar />
                <Alert severity="error">
                    Error loading board: {error}
                </Alert>
            </Container>
        );
    }

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
            <BoardBar board={board} />

            {/* Board Content */}
            <BoardContent
                board={board}
                createColumn={createColumn}
                createCard={createCard}
                deleteColumn={deleteColumn}
                reorderColumns={reorderColumns}
                reorderCards={reorderCards}
                moveCard={moveCard} />
        </Container>
    );
}

export default Board;