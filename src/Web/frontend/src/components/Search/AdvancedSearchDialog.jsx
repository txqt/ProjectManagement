import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControlLabel,
    Checkbox,
    Box,
    Typography,
    Grid,
    Chip,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    CircularProgress,
    Tabs,
    Tab,
    ListItemButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StyleIcon from '@mui/icons-material/Style';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';
import { apiService } from '~/services/api';

const AdvancedSearchDialog = ({ open, onClose, initialQuery = '' }) => {
    const [query, setQuery] = useState(initialQuery);
    const [searchBoards, setSearchBoards] = useState(true);
    const [searchCards, setSearchCards] = useState(true);
    const [searchUsers, setSearchUsers] = useState(false);
    const [assignedToMe, setAssignedToMe] = useState(false);
    const [boardTypes, setBoardTypes] = useState([]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const navigate = useNavigate();

    const handleSearch = async () => {
        // Validate at least one search type is selected
        if (!searchBoards && !searchCards && !searchUsers) {
            alert('Please select at least one search type (Boards, Cards, or Users)');
            return;
        }

        // Validate date range
        if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
            alert('Date From cannot be after Date To');
            return;
        }
        setLoading(true);
        try {
            const searchRequest = {
                query: query.trim(),
                searchBoards,
                searchCards,
                searchUsers,
                assignedToMe,
                boardTypes: boardTypes.length > 0 ? boardTypes : null,
                dateFrom: dateFrom ? new Date(dateFrom).toISOString() : null,
                dateTo: dateTo ? new Date(dateTo).toISOString() : null,
                page: 1,
                pageSize: 20
            };

            const response = await apiService.advancedSearch(searchRequest);
            setResults(response);

            // Auto-switch to appropriate tab based on results
            if (response.boards?.length > 0) setActiveTab(0);
            else if (response.cards?.length > 0) setActiveTab(1);
            else if (response.users?.length > 0) setActiveTab(2);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBoardTypeToggle = (type) => {
        setBoardTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const handleReset = () => {
        setQuery('');
        setSearchBoards(true);
        setSearchCards(true);
        setSearchUsers(false);
        setAssignedToMe(false);
        setBoardTypes([]);
        setDateFrom('');
        setDateTo('');
        setResults(null);
    };

    const handleBoardClick = (boardId) => {
        navigate(`/boards/${boardId}`);
        onClose();
    };

    const handleCardClick = (boardId, cardId) => {
        navigate(`/boards/${boardId}?card=${cardId}`);
        onClose();
    };

    const handleUserClick = (userId) => {
        console.log('User clicked:', userId);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: 600 }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SearchIcon />
                    <Typography variant="h6">Advanced Search</Typography>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={3}>
                    {/* Search Query */}
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Search"
                            placeholder="Enter keywords..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                        />
                    </Grid>

                    {/* Search Types */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                            Search in:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={searchBoards}
                                        onChange={(e) => setSearchBoards(e.target.checked)}
                                    />
                                }
                                label="Boards"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={searchCards}
                                        onChange={(e) => setSearchCards(e.target.checked)}
                                    />
                                }
                                label="Cards"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={searchUsers}
                                        onChange={(e) => setSearchUsers(e.target.checked)}
                                    />
                                }
                                label="Users"
                            />
                        </Box>
                    </Grid>

                    {/* Board Type Filter */}
                    {searchBoards && (
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                                Board Type:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip
                                    label="Public"
                                    onClick={() => handleBoardTypeToggle('public')}
                                    color={boardTypes.includes('public') ? 'primary' : 'default'}
                                    variant={boardTypes.includes('public') ? 'filled' : 'outlined'}
                                />
                                <Chip
                                    label="Private"
                                    onClick={() => handleBoardTypeToggle('private')}
                                    color={boardTypes.includes('private') ? 'primary' : 'default'}
                                    variant={boardTypes.includes('private') ? 'filled' : 'outlined'}
                                />
                            </Box>
                        </Grid>
                    )}

                    {/* Card Filters */}
                    {searchCards && (
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={assignedToMe}
                                        onChange={(e) => setAssignedToMe(e.target.checked)}
                                    />
                                }
                                label="Only cards assigned to me"
                            />
                        </Grid>
                    )}

                    {/* Date Range */}
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="Date From"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="Date To"
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    {/* Results */}
                    {results && (
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Results ({results.totalResults})
                            </Typography>

                            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                                <Tab label={`Boards (${results.totalBoards})`} />
                                <Tab label={`Cards (${results.totalCards})`} />
                                <Tab label={`Users (${results.totalUsers})`} />
                            </Tabs>

                            <Box sx={{ mt: 2, maxHeight: 300, overflowY: 'auto' }}>
                                {/* Boards Tab */}
                                {activeTab === 0 && (
                                    <List>
                                        {results.boards?.length > 0 ? (
                                            results.boards.map((board) => (
                                                <ListItemButton
                                                    sx={{ cursor: 'pointer' }}
                                                    key={board.id}
                                                    onClick={() => handleBoardClick(board.id)}
                                                >
                                                    <ListItemAvatar>
                                                        {board.cover ? (
                                                            <Avatar src={board.cover} variant="rounded" />
                                                        ) : (
                                                            <Avatar variant="rounded">
                                                                <DashboardIcon />
                                                            </Avatar>
                                                        )}
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={board.title}
                                                        secondary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Chip
                                                                    label={board.type}
                                                                    size="small"
                                                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                                                />
                                                                {board.ownerName && (
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        by {board.ownerName}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                </ListItemButton>
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                                No boards found
                                            </Typography>
                                        )}
                                    </List>
                                )}

                                {/* Cards Tab */}
                                {activeTab === 1 && (
                                    <List>
                                        {results.cards?.length > 0 ? (
                                            results.cards.map((card) => (
                                                <ListItem
                                                    sx={{ cursor: 'pointer' }}
                                                    key={card.id}
                                                    button
                                                    onClick={() => handleCardClick(card.boardId, card.id)}
                                                >
                                                    <ListItemAvatar>
                                                        {card.cover ? (
                                                            <Avatar src={card.cover} variant="rounded" />
                                                        ) : (
                                                            <Avatar variant="rounded">
                                                                <StyleIcon />
                                                            </Avatar>
                                                        )}
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={card.title}
                                                        secondary={
                                                            <Typography variant="caption" color="text.secondary">
                                                                in {card.boardTitle} → {card.columnTitle}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItem>
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                                No cards found
                                            </Typography>
                                        )}
                                    </List>
                                )}

                                {/* Users Tab */}
                                {activeTab === 2 && (
                                    <List>
                                        {results.users?.length > 0 ? (
                                            results.users.map((user) => (
                                                <ListItem
                                                    sx={{ cursor: 'pointer' }}
                                                    key={user.id}
                                                    button
                                                    onClick={() => handleUserClick(user.id)}
                                                >
                                                    <ListItemAvatar>
                                                        <Avatar src={user.avatar}>
                                                            {!user.avatar && <PersonIcon />}
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={user.userName}
                                                        secondary={user.email}
                                                    />
                                                </ListItem>
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                                No users found
                                            </Typography>
                                        )}
                                    </List>
                                )}
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleReset} disabled={loading}>
                    Reset
                </Button>
                <Button onClick={onClose} disabled={loading}>
                    Close
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSearch}
                    disabled={loading || !query.trim()}
                    startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                >
                    Search
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdvancedSearchDialog;