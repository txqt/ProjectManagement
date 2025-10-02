import { Container } from "@mui/material";
import { useEffect } from "react";
import { useParams } from 'react-router-dom';
import { toast } from "react-toastify";
import AppBar from "~/components/AppBar/AppBar";
import { useBoard } from "~/hooks/useBoard";
import BoardBar from "./BoardBar/BoardBar";
import BoardContent from "./BoxContent/BoardContent";

function Board() {
    const { boardId } = useParams();
    const { board, error, createColumn, createCard, deleteColumn, reorderColumns, reorderCards, moveCard, deleteCard, pendingTempIds } = useBoard(boardId);

    useEffect(() => {
        if (error) {
            toast.error(`${error}`);
        }
    }, [error]);

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
                moveCard={moveCard}
                deleteCard={deleteCard}
                pendingTempIds={pendingTempIds} />
        </Container>
    );
}

export default Board;