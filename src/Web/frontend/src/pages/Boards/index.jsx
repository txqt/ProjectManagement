import React from "react";
import {
    Grid,
    Card,
    CardContent,
    Typography,
    CardActionArea,
    CardMedia,
    Box,
    Button
} from "@mui/material";
import { apiService } from "~/services/api";
import { useState, useEffect } from "react";
import { useApi } from "~/hooks/useApi";
import { useNavigate } from "react-router-dom";

export default function BoardListView() {
    const { executeRequest } = useApi();
    const [boards, setBoards] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBoards = async () => {
            try {
                const { success, data, error } = await executeRequest(() => apiService.getBoards());
                if (success) {
                    setBoards(data);
                } else {
                    console.error("Error loading boards:", error);
                }
            } catch (error) {
                console.error("Unexpected error:", error);
            }
        };

        fetchBoards();
    }, [executeRequest]);


    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">
                    Your Boards
                </Typography>
                <Button variant="contained" color="primary">
                    Create New Board
                </Button>
            </Box>

            <Grid container display="flex" justifyContent="space-between">
                {boards.map((board) => (
                    <Grid ize={{ xs: 6, sm: 6, md: 4 }} key={board.id}>
                        <Card
                            sx={{
                                height: 300,
                                width: 300,
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 3,
                                boxShadow: 3,
                                ":hover": { boxShadow: 6, transform: "scale(1.02)" },
                                transition: "0.3s"
                            }}
                        >
                            <CardActionArea
                                onClick={() => navigate(`/boards/${board.id}`)}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'stretch'
                                }}
                            >
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={board.cover}
                                    alt={board.title}
                                    sx={{ flexShrink: 0 }}
                                />
                                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Typography
                                        gutterBottom
                                        variant="h6"
                                        component="div"
                                        sx={{
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {board.title}
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            flexGrow: 1,
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {board.description}
                                    </Typography>

                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}