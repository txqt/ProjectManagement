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
    
    const error = useBoardStore((state) => state.error);

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
            <BoardContent />
        </Container>
    );
}

export default Board;