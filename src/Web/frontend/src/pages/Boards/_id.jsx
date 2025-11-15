import { Container } from "@mui/material";
import { useEffect } from "react";
import { useParams } from 'react-router-dom';
import { toast } from "react-toastify";
import AppBar from "~/components/AppBar/AppBar";
import { useBoardSignalR } from "~/hooks/useBoardSignalR";
import { useBoardStore } from "~/stores/boardStore";
import BoardBar from "./BoardBar/BoardBar";
import BoardContent from "./BoxContent/BoardContent";

function Board() {
    const { boardId } = useParams();
    
    // Setup SignalR connection
    const { connectionError } = useBoardSignalR(boardId);
    
    // Get state and actions directly from store
    const board = useBoardStore((state) => state.board);
    const error = useBoardStore((state) => state.error);
    const pendingTempIds = useBoardStore((state) => state.pendingTempIds);
    
    const createColumn = useBoardStore((state) => state.createColumn);
    const updateColumn = useBoardStore((state) => state.updateColumn);
    const deleteColumn = useBoardStore((state) => state.deleteColumn);
    const reorderColumns = useBoardStore((state) => state.reorderColumns);
    
    const createCard = useBoardStore((state) => state.createCard);
    const updateCard = useBoardStore((state) => state.updateCard);
    const deleteCard = useBoardStore((state) => state.deleteCard);
    const reorderCards = useBoardStore((state) => state.reorderCards);
    const moveCard = useBoardStore((state) => state.moveCard);
    
    const assignCardMember = useBoardStore((state) => state.assignCardMember);
    const unassignCardMember = useBoardStore((state) => state.unassignCardMember);

    // Show errors
    useEffect(() => {
        if (error) {
            toast.error(`${error}`);
        }
    }, [error]);

    // Show connection errors
    useEffect(() => {
        if (connectionError) {
            toast.error(`SignalR: ${connectionError}`);
        }
    }, [connectionError]);

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
            <BoardContent
                board={board}
            />
        </Container>
    );
}

export default Board;