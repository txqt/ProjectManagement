import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  TextField,
  Typography
} from "@mui/material";
import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { useApi } from "~/hooks/useApi";
import { apiService } from "~/services/api";
import { toast } from "react-toastify";

export default function BoardListView() {
  const { error, executeRequest } = useApi();
  const [boards, setBoards] = useState([]);
  const [open, setOpen] = useState(false);

  const initialBoardState = { title: "", description: "", type: "private" };
  const [newBoard, setNewBoard] = useState(initialBoardState);
  const navigate = useNavigate();

  const typeOptions = [
    { value: "private", label: "Private", desc: "Only invited members", icon: <LockIcon fontSize="small" /> },
    { value: "public", label: "Public", desc: "Anyone with link can view", icon: <PublicIcon fontSize="small" /> }
  ];

  // Context menu state (right-click)
  const [contextMenu, setContextMenu] = useState(null);

  // Delete confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState(null);

  // load boards
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const { success, data } = await executeRequest(() =>
          apiService.getBoards()
        );
        if (success) {
          setBoards(data);
        } else {
          toast.error(error);
        }
      } catch (err) {
        toast.error(`Unexpected error: \n ${err}`);
      }
    };

    fetchBoards();
  }, [error, executeRequest]);

  // create board
  const handleCreateBoard = async () => {
    const { success, data, error: apiErr } = await executeRequest(() =>
      apiService.createBoard(newBoard)
    );
    if (success) {
      setBoards((prev) => [...prev, data]);
      setOpen(false);
      // reset form to initial state
      setNewBoard(initialBoardState);
    } else {
      toast.error(`Error creating board: \n ${apiErr}`);
    }
  };

  // Context menu handlers
  const handleContextMenu = (event, boardId) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      boardId,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // Open confirm dialog (from menu)
  const openConfirmDialog = (boardId) => {
    handleCloseContextMenu();
    setSelectedBoardId(boardId);
    setConfirmOpen(true);
  };

  const closeConfirmDialog = () => {
    setConfirmOpen(false);
    setSelectedBoardId(null);
  };

  // Actual delete action (called when confirm)
  const handleConfirmDelete = async () => {
    const boardId = selectedBoardId;
    closeConfirmDialog();
    if (!boardId) return;

    try {
      const { success, error: apiError } = await executeRequest(() =>
        apiService.deleteBoard(boardId)
      );
      if (success) {
        setBoards(prev => prev.filter(b => b.id !== boardId));
        toast.success("Xóa board thành công");
      } else {
        toast.error(`Xóa thất bại: ${apiError}`);
      }
    } catch (err) {
      toast.error(`Unexpected error: ${err}`);
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
              onContextMenu={(e) => handleContextMenu(e, board.id)}
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

      {/* Context menu */}
      <Menu
        open={Boolean(contextMenu)}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu && contextMenu.mouseX != null && contextMenu.mouseY != null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => openConfirmDialog(contextMenu ? contextMenu.boardId : null)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Xóa board
        </MenuItem>
        {/* thêm menu item khác nếu cần */}
      </Menu>

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

      {/* Delete confirmation dialog */}
      <Dialog open={confirmOpen} onClose={closeConfirmDialog}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xóa board này? Hành động không thể hoàn tác.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog}>Hủy</Button>
          <Button variant="contained" onClick={handleConfirmDelete}>Xóa</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
