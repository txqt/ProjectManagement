import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LockIcon from "@mui/icons-material/Lock";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PublicIcon from "@mui/icons-material/Public";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardMedia,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Pagination,
  Select,
  TextField,
  Typography
} from "@mui/material";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useApi } from "~/hooks/useApi";
import { apiService } from "~/services/api";

export default function BoardListView() {
  const { executeRequest } = useApi();

  const [boards, setBoards] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");

  const initialBoardState = { title: "", description: "", type: "private" };
  const [newBoard, setNewBoard] = useState(initialBoardState);
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedBoard, setSelectedBoard] = useState(null);

  const handleOpenMenu = (event, board) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedBoard(board);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelectedBoard(null);
  };

  const handleCloneBoard = async () => {
    if (!selectedBoard) return;

    try {
      const cloneData = {
        title: selectedBoard.title + " (Clone)",
        includeCards: true,
        includeLists: true,
      };

      const cloneBoard = await executeRequest(() =>
        apiService.cloneBoard(selectedBoard.id, cloneData)
      );

      if (cloneBoard !== null) {
        setBoards((prevBoards) => [cloneBoard, ...prevBoards]);
        toast.success("Board cloned successfully!");
      } else {
        toast.error("Failed to clone board");
      }
    } catch (err) {
      toast.error("Clone failed: " + err.message);
    }
  };

  const STORAGE_KEY = "board-list-options";

  const typeOptions = [
    { value: "private", label: "Private", desc: "Only invited members", icon: <LockIcon fontSize="small" /> },
    { value: "public", label: "Public", desc: "Anyone with link can view", icon: <PublicIcon fontSize="small" /> }
  ];

  const sortOptions = [
    { value: "title-asc", label: "Title (A-Z)" },
    { value: "title-desc", label: "Title (Z-A)" },
    { value: "lastModified-desc", label: "Last Modified (Newest)" },
    { value: "lastModified-asc", label: "Last Modified (Oldest)" },
    { value: "createdAt-desc", label: "Created Date (Newest)" },
    { value: "createdAt-asc", label: "Created Date (Oldest)" },
  ];

  const fetchBoards = useCallback(async (page, pageSize, search, sort, order) => {
    setLoading(true);
    try {
      const { success, data } = await executeRequest(() =>
        apiService.getBoards(page, pageSize, search, sort, order)
      );
      if (success) {
        console.log("API data:", data);
        setBoards(data.items || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 0);
      }
    } catch (err) {
      toast.error(`Error loading boards: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [executeRequest]);

  const debouncedFetch = useCallback(
    debounce((page, pageSize, search, sort, order) => {
      fetchBoards(page, pageSize, search, sort, order);
    }, 0),
    [fetchBoards]
  );

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const opts = JSON.parse(saved);

      if (opts.sortBy) setSortBy(opts.sortBy);
      if (opts.sortOrder) setSortOrder(opts.sortOrder);
      if (opts.itemsPerPage) setItemsPerPage(opts.itemsPerPage);
      if (opts.currentPage) setCurrentPage(opts.currentPage);
    }
  }, []);

  useEffect(() => {
    const opts = {
      sortBy,
      sortOrder,
      itemsPerPage,
      currentPage,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(opts));
  }, [sortBy, sortOrder, itemsPerPage, currentPage]);

  useEffect(() => {
    debouncedFetch(currentPage, itemsPerPage, searchTerm, sortBy, sortOrder);
  }, [currentPage, itemsPerPage, searchTerm, sortBy, sortOrder, debouncedFetch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, searchTerm, sortBy, sortOrder]);

  const handleCreateBoard = async () => {
    const { success, error: apiErr } = await executeRequest(() =>
      apiService.createBoard(newBoard)
    );
    if (success) {
      setOpen(false);
      setNewBoard(initialBoardState);
      toast.success("Board created successfully!");
      fetchBoards(currentPage, itemsPerPage, searchTerm, sortBy, sortOrder);
    } else {
      toast.error(`Error creating board: ${apiErr}`);
    }
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSortChange = (event) => {
    const [sort, order] = event.target.value.split('-');
    setSortBy(sort);
    setSortOrder(order);
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Your Boards
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {totalCount} board{totalCount !== 1 ? 's' : ''} total
          </Typography>
        </Box>
        <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
          Create New Board
        </Button>
      </Box>

      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search boards..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={`${sortBy}-${sortOrder}`}
                label="Sort By"
                onChange={handleSortChange}
              >
                {sortOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Boards per page</InputLabel>
              <Select
                value={itemsPerPage}
                label="Boards per page"
                onChange={handleItemsPerPageChange}
              >
                <MenuItem value={6}>6 per page</MenuItem>
                <MenuItem value={12}>12 per page</MenuItem>
                <MenuItem value={24}>24 per page</MenuItem>
                <MenuItem value={48}>48 per page</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Typography variant="body2" color="text.secondary" textAlign="right">
              {totalCount > 0 ? `${startIndex}-${endIndex} of ${totalCount}` : 'No results'}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : boards.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {boards.map((board) => (
              <Grid size={{ xs: 12, sm: 12, md: 2 }} key={board.id}>
                <Card
                  sx={{
                    height: 250,
                    position: "relative",
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: 2,
                    ":hover": { boxShadow: 6, transform: "scale(1.02)" },
                    transition: "all 0.3s"
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenMenu(e, board)}
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, color: "white" }}
                  >
                    <MoreVertIcon />
                  </IconButton>

                  <CardActionArea
                    onClick={() => navigate(`/boards/${board.id}`)}
                    sx={{ height: "100%", position: "relative" }}
                  >
                    <CardMedia
                      component="img"
                      image={
                        board.cover ||
                        "https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                      }
                      alt={board.title}
                      sx={{
                        height: "100%",
                        width: "100%",
                        objectFit: "cover",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        zIndex: 1
                      }}
                    />

                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 2,
                        zIndex: 2,
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))"
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color: "white",
                          fontWeight: "bold",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {board.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(255,255,255,0.9)",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {board.description}
                      </Typography>
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      ) : (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm ? 'No boards found matching your search' : 'No boards found'}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first board to get started'}
          </Typography>
          {!searchTerm && (
            <Button variant="contained" onClick={() => setOpen(true)}>
              Create Board
            </Button>
          )}
        </Box>
      )}

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
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            handleCloneBoard();
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Clone board" />
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleCloseMenu();
            handleSaveTemplate();
          }}
        >
          <ListItemIcon>
            <AutoAwesomeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Save as template" />
        </MenuItem>
      </Menu>
    </Box>
  );
}