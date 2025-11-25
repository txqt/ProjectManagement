import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    Chip,
    Divider,
    IconButton,
    useTheme,
    alpha,
    Grid,
} from '@mui/material';
import {
    Close as CloseIcon,
    Keyboard as KeyboardIcon,
    Search as SearchIcon,
    Add as AddIcon,
    Dashboard as BoardIcon,
    CreditCard as CardIcon,
    Help as HelpIcon,
} from '@mui/icons-material';

const KeyboardShortcutsDialog = ({ open, onClose }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const shortcuts = [
        {
            category: 'Global',
            icon: <HelpIcon />,
            items: [
                { keys: ['?'], description: 'Show/hide this help dialog', working: true },
                { keys: ['Esc'], description: 'Close dialogs and modals', working: true },
            ],
        },
        {
            category: 'Navigation',
            icon: <SearchIcon />,
            items: [
                { keys: ['/'], description: 'Focus search box' },
            ],
        },
    ];

    const comingSoonShortcuts = [
        {
            category: 'Actions',
            icon: <AddIcon />,
            items: [
                { keys: ['N'], description: 'Create new card (on board)' },
                { keys: ['B'], description: 'Create new board' },
                { keys: ['Ctrl', 'K'], description: 'Quick command palette' },
            ],
        },
        {
            category: 'Board',
            icon: <BoardIcon />,
            items: [
                { keys: ['C'], description: 'Add new column (on board)' },
                { keys: ['F'], description: 'Toggle board filters' },
            ],
        },
        {
            category: 'Card',
            icon: <CardIcon />,
            items: [
                { keys: ['Enter'], description: 'Open card details' },
                { keys: ['E'], description: 'Edit card (when selected)' },
                { keys: ['D'], description: 'Delete card (when selected)' },
            ],
        },
    ];

    const KeyChip = ({ keyName }) => (
        <Chip
            label={keyName}
            size="small"
            sx={{
                fontFamily: 'monospace',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                background: isDark
                    ? alpha(theme.palette.primary.main, 0.2)
                    : alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                '& .MuiChip-label': {
                    px: 1,
                },
            }}
        />
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    background: isDark
                        ? alpha('#1a1a1a', 0.95)
                        : alpha('#ffffff', 0.95),
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                },
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                            }}
                        >
                            <KeyboardIcon />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Keyboard Shortcuts
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Speed up your workflow with these shortcuts
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {shortcuts.map((section, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Box sx={{ color: theme.palette.primary.main }}>
                                        {section.icon}
                                    </Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        {section.category}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {section.items.map((item, itemIndex) => (
                                        <Box
                                            key={itemIndex}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                p: 1.5,
                                                borderRadius: 2,
                                                background: isDark
                                                    ? alpha('#ffffff', 0.03)
                                                    : alpha('#000000', 0.02),
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    background: isDark
                                                        ? alpha('#ffffff', 0.05)
                                                        : alpha('#000000', 0.04),
                                                },
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ flex: 1 }}
                                            >
                                                {item.description}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, p: 1 }}>
                                                {item.keys.map((key, keyIndex) => (
                                                    <KeyChip key={keyIndex} keyName={key} />
                                                ))}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                {/* Coming Soon Section */}
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, opacity: 0.7 }}>
                        Coming Soon
                    </Typography>
                    <Grid container spacing={3}>
                        {comingSoonShortcuts.map((section, index) => (
                            <Grid item xs={12} sm={6} key={index}>
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <Box sx={{ color: theme.palette.text.disabled }}>
                                            {section.icon}
                                        </Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, opacity: 0.6 }}>
                                            {section.category}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {section.items.map((item, itemIndex) => (
                                            <Box
                                                key={itemIndex}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    background: isDark
                                                        ? alpha('#ffffff', 0.02)
                                                        : alpha('#000000', 0.01),
                                                    opacity: 0.5,
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ flex: 1 }}
                                                >
                                                    {item.description}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    {item.keys.map((key, keyIndex) => (
                                                        <KeyChip key={keyIndex} keyName={key} />
                                                    ))}
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                <Box
                    sx={{
                        mt: 3,
                        p: 2,
                        borderRadius: 2,
                        background: alpha(theme.palette.info.main, 0.1),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <HelpIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Pro Tip
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Keyboard shortcuts won't work when you're typing in text fields.
                        Press <KeyChip keyName="Esc" /> to exit any input and use shortcuts again.
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default KeyboardShortcutsDialog;
