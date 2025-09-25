import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CardActionArea,
  CardMedia,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import PeopleIcon from "@mui/icons-material/People";
import PublicIcon from "@mui/icons-material/Public";

import { apiService } from "~/services/api";
import { useApi } from "~/hooks/useApi";
import { useNavigate } from "react-router-dom";

export default function BoardListView() {
  const { executeRequest } = useApi();
  const [boards, setBoards] = useState([]);
  const [open, setOpen] = useState(false);

  const initialBoardState = { title: "", description: "", type: "private" };
  const [newBoard, setNewBoard] = useState(initialBoardState);
  const navigate = useNavigate();

  const typeOptions = [
    { value: "private", label: "Private", desc: "Only invited members", icon: <LockIcon fontSize="small" /> },
    { value: "public", label: "Public", desc: "Anyone with link can view", icon: <PublicIcon fontSize="small" /> }
  ];

  // load boards
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const { success, data, error } = await executeRequest(() =>
          apiService.getBoards()
        );
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

  // create board
  const handleCreateBoard = async () => {
    const { success, data, error } = await executeRequest(() =>
      apiService.createBoard(newBoard)
    );
    if (success) {
      setBoards((prev) => [...prev, data]);
      setOpen(false);
      // reset form to initial state
      setNewBoard(initialBoardState);
    } else {
      console.error("Error creating board:", error);
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Your Boards
        </Typography>
        <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
          Create New Board
        </Button>
      </Box>

      <Grid container spacing={2}>
        {boards.map((board) => (
          <Grid item xs={6} sm={6} md={4} key={board.id}>
            <Card
              sx={{
                height: 300,
                width: 300,
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                boxShadow: 3,
                ":hover": { boxShadow: 6, transform: "scale(1.02)" },
                transition: "0.3s"
              }}
            >
              <CardActionArea
                onClick={() => navigate(`/boards/${board.id}`)}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch"
                }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={board.cover}
                  alt={board.title}
                  sx={{ flexShrink: 0 }}
                />
                <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                  <Typography
                    gutterBottom
                    variant="h6"
                    component="div"
                    sx={{
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {board.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      flexGrow: 1,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis"
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

      {/* Dialog Create Board */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New Board</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Title"
            fullWidth
            value={newBoard.title}
            onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newBoard.description}
            onChange={(e) =>
              setNewBoard({ ...newBoard, description: e.target.value })
            }
          />

          <FormControl fullWidth margin="dense">
            <InputLabel id="board-type-label">Type</InputLabel>
            <Select
              labelId="board-type-label"
              label="Type"
              value={newBoard.type}
              onChange={(e) => setNewBoard({ ...newBoard, type: e.target.value })}
              renderValue={(selected) => {
                const opt = typeOptions.find(o => o.value === selected);
                return (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {opt?.icon}
                    <Typography sx={{ ml: 1 }}>{opt?.label}</Typography>
                  </Box>
                );
              }}
            >
              {typeOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <ListItemIcon>{opt.icon}</ListItemIcon>
                  <ListItemText
                    primary={opt.label}
                    secondary={opt.desc}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateBoard}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}