import { Box, Container, Typography, List, ListItem, ListItemButton, ListItemText, Paper, useTheme, alpha } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import {
    InstallDesktop as InstallIcon,
    Rocket as RocketIcon,
    Store as StoreIcon,
    Code as CodeIcon,
    Favorite as ContributeIcon,
} from '@mui/icons-material';

export default function Docs() {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const docSections = [
        {
            title: 'Installation & Upgrading',
            path: '/docs/installation',
            icon: <InstallIcon />,
            description: 'Get started with installation and upgrade guides',
        },
        {
            title: 'Getting Started',
            path: '/docs/getting-started',
            icon: <RocketIcon />,
            description: 'Learn the basics and create your first project',
        },
        {
            title: 'Running Your App',
            path: '/docs/running-app',
            icon: <StoreIcon />,
            description: 'Manage and operate your project store',
        },
        {
            title: 'Developer Guide',
            path: '/docs/developer-guide',
            icon: <CodeIcon />,
            description: 'Technical documentation for developers',
        },
        {
            title: 'Contribute',
            path: '/docs/contribute',
            icon: <ContributeIcon />,
            description: 'Help us improve the project',
        },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <Box sx={{ minHeight: '100vh', background: isDark ? '#0a0a0a' : '#f8f9fa' }}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Typography
                    variant="h3"
                    sx={{
                        fontWeight: 700,
                        mb: 1,
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Documentation
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                    Everything you need to know about Project Management
                </Typography>

                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                    {/* Sidebar */}
                    <Paper
                        sx={{
                            width: { xs: '100%', md: 280 },
                            height: 'fit-content',
                            position: { md: 'sticky' },
                            top: 20,
                            background: isDark ? alpha('#1a1a1a', 0.6) : 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            borderRadius: 3,
                            overflow: 'hidden',
                        }}
                    >
                        <List sx={{ p: 1 }}>
                            {docSections.map((section) => (
                                <ListItem key={section.path} disablePadding sx={{ mb: 0.5 }}>
                                    <ListItemButton
                                        onClick={() => navigate(section.path)}
                                        selected={isActive(section.path)}
                                        sx={{
                                            borderRadius: 2,
                                            transition: 'all 0.3s ease',
                                            '&.Mui-selected': {
                                                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                '&:hover': {
                                                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                                },
                                                '& .MuiListItemText-primary': {
                                                    fontWeight: 600,
                                                },
                                            },
                                            '&:hover': {
                                                background: alpha(theme.palette.primary.main, 0.1),
                                            },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {section.icon}
                                            </Box>
                                            <ListItemText
                                                primary={section.title}
                                                primaryTypographyProps={{
                                                    fontSize: '0.95rem',
                                                }}
                                            />
                                        </Box>
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>

                    {/* Content Area */}
                    <Box sx={{ flex: 1 }}>
                        <Outlet />
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
