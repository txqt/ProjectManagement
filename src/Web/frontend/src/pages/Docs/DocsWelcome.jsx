import { Box, Typography, Paper, useTheme, alpha, Grid, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    InstallDesktop as InstallIcon,
    Rocket as RocketIcon,
    Store as StoreIcon,
    Code as CodeIcon,
    Favorite as ContributeIcon,
} from '@mui/icons-material';

export default function DocsWelcome() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const docSections = [
        {
            title: 'Installation & Upgrading',
            path: '/docs/installation',
            icon: <InstallIcon sx={{ fontSize: 48 }} />,
            description: 'Get started with installation and upgrade guides',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        {
            title: 'Getting Started',
            path: '/docs/getting-started',
            icon: <RocketIcon sx={{ fontSize: 48 }} />,
            description: 'Learn the basics and create your first project',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        },
        {
            title: 'Running Your App',
            path: '/docs/running-app',
            icon: <StoreIcon sx={{ fontSize: 48 }} />,
            description: 'Manage and operate your project',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        },
        {
            title: 'Developer Guide',
            path: '/docs/developer-guide',
            icon: <CodeIcon sx={{ fontSize: 48 }} />,
            description: 'Technical documentation for developers',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        },
        {
            title: 'Contribute',
            path: '/docs/contribute',
            icon: <ContributeIcon sx={{ fontSize: 48 }} />,
            description: 'Help us improve the project',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        },
    ];

    return (
        <Paper
            sx={{
                p: 4,
                background: isDark ? alpha('#1a1a1a', 0.6) : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 3,
            }}
        >
            <Typography
                variant="h4"
                sx={{
                    fontWeight: 700,
                    mb: 2,
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}
            >
                Welcome to the Documentation
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Choose a section below to get started
            </Typography>

            <Grid container spacing={3}>
                {docSections.map((section, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                        <Card
                            onClick={() => navigate(section.path)}
                            sx={{
                                height: '100%',
                                background: isDark ? alpha('#1a1a1a', 0.6) : 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                borderRadius: 3,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: `0 10px 30px ${alpha('#000', 0.15)}`,
                                },
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box
                                    sx={{
                                        width: 70,
                                        height: 70,
                                        borderRadius: '16px',
                                        background: section.gradient,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 2,
                                        color: 'white',
                                    }}
                                >
                                    {section.icon}
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                    {section.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {section.description}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
}
