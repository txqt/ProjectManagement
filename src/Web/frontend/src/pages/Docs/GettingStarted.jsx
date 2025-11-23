import { Box, Typography, Paper, useTheme, alpha, Divider, Card, CardContent, Grid } from '@mui/material';
import {
    AccountCircle as AccountIcon,
    Dashboard as BoardIcon,
    ViewColumn as ColumnIcon,
    CreditCard as CardIcon,
    Group as TeamIcon,
    Notifications as NotificationIcon,
} from '@mui/icons-material';

export default function GettingStarted() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const steps = [
        {
            icon: <AccountIcon sx={{ fontSize: 48 }} />,
            title: 'Create Your Account',
            description: 'Sign up for a free account to get started. Fill in your email, username, and password.',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        {
            icon: <BoardIcon sx={{ fontSize: 48 }} />,
            title: 'Create Your First Board',
            description: 'Boards are the foundation of your project. Create a board for each project or team.',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        },
        {
            icon: <ColumnIcon sx={{ fontSize: 48 }} />,
            title: 'Add Columns',
            description: 'Organize your workflow with columns like "To Do", "In Progress", and "Done".',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        },
        {
            icon: <CardIcon sx={{ fontSize: 48 }} />,
            title: 'Create Cards',
            description: 'Add cards to represent tasks, features, or any work items. Add details, attachments, and comments.',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        },
        {
            icon: <TeamIcon sx={{ fontSize: 48 }} />,
            title: 'Invite Team Members',
            description: 'Collaborate with your team by inviting members to your board. Assign roles and permissions.',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        },
        {
            icon: <NotificationIcon sx={{ fontSize: 48 }} />,
            title: 'Stay Updated',
            description: 'Receive real-time notifications about changes, comments, and updates on your boards.',
            gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        },
    ];

    const Section = ({ title, children }) => (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                {title}
            </Typography>
            {children}
        </Box>
    );

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
                Getting Started
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Learn the basics and start managing your projects effectively
            </Typography>

            <Divider sx={{ mb: 4 }} />

            <Section title="Quick Start Guide">
                <Typography variant="body1" paragraph>
                    Welcome to Project Management! Follow these steps to get up and running in minutes.
                </Typography>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                    {steps.map((step, index) => (
                        <Grid item xs={12} md={6} key={index}>
                            <Card
                                sx={{
                                    height: '100%',
                                    background: isDark ? alpha('#1a1a1a', 0.6) : 'rgba(255, 255, 255, 0.9)',
                                    backdropFilter: 'blur(10px)',
                                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    borderRadius: 3,
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
                                            background: step.gradient,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mb: 2,
                                            color: 'white',
                                        }}
                                    >
                                        {step.icon}
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        {index + 1}. {step.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {step.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Section>

            <Section title="Understanding Boards">
                <Typography variant="body1" paragraph>
                    A <strong>Board</strong> is your project workspace. Each board contains:
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li><strong>Columns:</strong> Represent different stages of your workflow</li>
                    <li><strong>Cards:</strong> Individual tasks or work items</li>
                    <li><strong>Members:</strong> Team members who can collaborate</li>
                    <li><strong>Activity Log:</strong> History of all changes and updates</li>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    You can create multiple boards for different projects, teams, or purposes.
                </Typography>
            </Section>

            <Section title="Working with Cards">
                <Typography variant="body1" paragraph>
                    Cards are the heart of your workflow. Each card can include:
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li><strong>Title & Description:</strong> What needs to be done</li>
                    <li><strong>Attachments:</strong> Upload files, images, or documents</li>
                    <li><strong>Comments:</strong> Discuss and collaborate with team members</li>
                    <li><strong>Labels:</strong> Categorize and organize cards</li>
                    <li><strong>Checklists:</strong> Break down tasks into smaller steps</li>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    Simply drag and drop cards between columns to update their status.
                </Typography>
            </Section>

            <Section title="Collaborating with Your Team">
                <Typography variant="body1" paragraph>
                    Project Management is built for team collaboration:
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li><strong>Invite Members:</strong> Share your board via email invitation</li>
                    <li><strong>Real-time Updates:</strong> See changes as they happen with SignalR</li>
                    <li><strong>Comments & Mentions:</strong> Communicate directly on cards</li>
                    <li><strong>Notifications:</strong> Stay informed about important updates</li>
                    <li><strong>Activity Tracking:</strong> Monitor who did what and when</li>
                </Box>
            </Section>

            <Section title="Best Practices">
                <Typography variant="body1" paragraph>
                    Get the most out of Project Management with these tips:
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li>Keep card titles clear and concise</li>
                    <li>Use descriptions to provide context and details</li>
                    <li>Add attachments for reference materials</li>
                    <li>Comment on cards to keep discussions organized</li>
                    <li>Regularly update card positions to reflect current status</li>
                    <li>Use labels and categories to organize cards</li>
                    <li>Utilize checklists for complex tasks</li>
                </Box>
            </Section>

            <Section title="Next Steps">
                <Typography variant="body1" paragraph>
                    Now that you know the basics, explore more features:
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                    <li>Check out the <strong>Developer Guide</strong> for API integration</li>
                    <li>Learn about deployment in <strong>Running Your Store</strong></li>
                    <li>Contribute to the project - see our <strong>Contribute</strong> guide</li>
                </Box>
            </Section>
        </Paper>
    );
}
