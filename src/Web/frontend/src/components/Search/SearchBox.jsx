import { useState, useEffect, useRef } from 'react';
import {
    Box,
    TextField,
    InputAdornment,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Divider,
    Button,
    CircularProgress,
    Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StyleIcon from '@mui/icons-material/Style';
import PersonIcon from '@mui/icons-material/Person';
import TuneIcon from '@mui/icons-material/Tune';
import { useNavigate } from 'react-router-dom';
import { apiService } from '~/services/api';

const SearchBox = ({ onAdvancedSearchClick }) => {
    const [searchValue, setSearchValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState(null);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();
    const debounceTimer = useRef(null);

    // Handle click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (searchValue.length < 2) {
            setSuggestions(null);
            return;
        }

        setLoading(true);

        // Clear previous timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Set new timer
        debounceTimer.current = setTimeout(async () => {
            try {
                const results = await apiService.quickSearch(searchValue, 5);
                setSuggestions(results);
            } catch (error) {
                console.error('Search error:', error);
                setSuggestions(null);
            } finally {
                setLoading(false);
            }
        }, 300); // 300ms debounce

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [searchValue]);

    const handleFocus = () => {
        setShowSuggestions(true);
    };

    const handleClear = () => {
        setSearchValue('');
        setSuggestions(null);
    };

    const handleBoardClick = (boardId) => {
        navigate(`/boards/${boardId}`);
        setShowSuggestions(false);
        setSearchValue('');
    };

    const handleCardClick = (boardId, cardId) => {
        navigate(`/boards/${boardId}?card=${cardId}`);
        setShowSuggestions(false);
        setSearchValue('');
    };

    const handleUserClick = (userId) => {
        // Navigate to user profile if you have this route
        console.log('User clicked:', userId);
        setShowSuggestions(false);
    };

    const handleAdvancedSearch = () => {
        setShowSuggestions(false);
        if (onAdvancedSearchClick) {
            onAdvancedSearchClick(searchValue);
        }
    };

    const hasResults = suggestions &&
        (suggestions.boards?.length > 0 ||
            suggestions.cards?.length > 0 ||
            suggestions.users?.length > 0);

    return (
        <Box ref={searchRef} sx={{ position: 'relative', width: '100%', maxWidth: 300 }}>
            <TextField
                placeholder="Search boards, cards..."
                type="text"
                size="small"
                fullWidth
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={handleFocus}
                sx={{
                    '& label': { color: 'white' },
                    '& input': { color: 'white' },
                    '& label.Mui-focused': { color: 'white' },
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'white' },
                        '&:hover fieldset': { borderColor: 'white' },
                        '&.Mui-focused fieldset': { borderColor: 'white' }
                    }
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            {loading ? (
                                <CircularProgress size={20} sx={{ color: 'white' }} />
                            ) : (
                                <SearchIcon sx={{ color: 'white' }} />
                            )}
                        </InputAdornment>
                    ),
                    endAdornment: searchValue && (
                        <InputAdornment position="end">
                            <CloseIcon
                                fontSize="small"
                                sx={{ color: 'white', cursor: 'pointer' }}
                                onClick={handleClear}
                            />
                        </InputAdornment>
                    )
                }}
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && searchValue.length >= 2 && (
                <Paper
                    elevation={8}
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        mt: 0.5,
                        maxHeight: 500,
                        overflowY: 'auto',
                        zIndex: 1300,
                        borderRadius: 2
                    }}
                >
                    {loading ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <CircularProgress size={24} />
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Searching...
                            </Typography>
                        </Box>
                    ) : hasResults ? (
                        <List sx={{ p: 0 }}>
                            {/* Boards Section */}
                            {suggestions.boards?.length > 0 && (
                                <>
                                    <Box sx={{ px: 2, py: 1, bgcolor: 'grey.100' }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                            BOARDS
                                        </Typography>
                                    </Box>
                                    {suggestions.boards.map((board) => (
                                        <ListItem
                                            key={board.id}
                                            button
                                            onClick={() => handleBoardClick(board.id)}
                                            sx={{ '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }}
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
                                                    <Typography component="div" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Chip
                                                            label={board.type}
                                                            size="small"
                                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                                        />
                                                        {board.ownerName && (
                                                            <Typography variant="caption" color="text.secondary" component="span">
                                                                by {board.ownerName}
                                                            </Typography>
                                                        )}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                    <Divider />
                                </>
                            )}

                            {/* Cards Section */}
                            {suggestions.cards?.length > 0 && (
                                <>
                                    <Box sx={{ px: 2, py: 1, bgcolor: 'grey.100' }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                            CARDS
                                        </Typography>
                                    </Box>
                                    {suggestions.cards.map((card) => (
                                        <ListItem
                                            key={card.id}
                                            button
                                            onClick={() => handleCardClick(card.boardId, card.id)}
                                            sx={{ '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }}
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
                                    ))}
                                    <Divider />
                                </>
                            )}

                            {/* Users Section */}
                            {suggestions.users?.length > 0 && (
                                <>
                                    <Box sx={{ px: 2, py: 1, bgcolor: 'grey.100' }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                            PEOPLE
                                        </Typography>
                                    </Box>
                                    {suggestions.users.map((user) => (
                                        <ListItem
                                            key={user.id}
                                            button
                                            onClick={() => handleUserClick(user.id)}
                                            sx={{ '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }}
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
                                    ))}
                                    <Divider />
                                </>
                            )}
                        </List>
                    ) : (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                No results found for "{searchValue}"
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
                        <Typography>
                            Returned Count: {suggestions?.returnedCount}
                        </Typography>
                    </Box>

                    {/* Footer with Advanced Search button */}
                    <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
                        <Button
                            fullWidth
                            startIcon={<TuneIcon />}
                            onClick={handleAdvancedSearch}
                            sx={{ justifyContent: 'flex-start' }}
                        >
                            Advanced Search
                        </Button>
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default SearchBox;