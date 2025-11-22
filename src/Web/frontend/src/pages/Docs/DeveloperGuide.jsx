import { Box, Typography, Paper, useTheme, alpha, Divider, Alert } from '@mui/material';
import { Code as CodeIcon } from '@mui/icons-material';

export default function DeveloperGuide() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const Section = ({ title, children }) => (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                {title}
            </Typography>
            {children}
        </Box>
    );

    const CodeBlock = ({ children, language = 'javascript' }) => (
        <Paper
            sx={{
                p: 2,
                background: isDark ? '#1e1e1e' : '#f5f5f5',
                borderRadius: 2,
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                overflow: 'auto',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.7 }}>
                <CodeIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption">{language}</Typography>
            </Box>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {children}
            </pre>
        </Paper>
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
                Developer Guide
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Technical documentation for developers building with Project Management
            </Typography>

            <Divider sx={{ mb: 4 }} />

            <Section title="Architecture Overview">
                <Typography variant="body1" paragraph>
                    Project Management follows a modern, scalable architecture:
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li><strong>Backend:</strong> ASP.NET Core 8.0 Web API with Entity Framework Core</li>
                    <li><strong>Frontend:</strong> React 18 with Material-UI (MUI) and Vite</li>
                    <li><strong>Real-time:</strong> SignalR for live updates and notifications</li>
                    <li><strong>State Management:</strong> Zustand for client-side state</li>
                    <li><strong>Database:</strong> SQL Server with Code-First migrations</li>
                </Box>
            </Section>

            <Section title="API Reference">
                <Typography variant="body1" paragraph>
                    The REST API provides comprehensive endpoints for all operations.
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Authentication
                </Typography>
                <CodeBlock language="http">
                    {`POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Board Endpoints
                </Typography>
                <CodeBlock language="http">
                    {`GET /api/boards
POST /api/boards
PUT /api/boards/{boardId}
DELETE /api/boards/{boardId}`}
                </CodeBlock>
            </Section>

            <Section title="SignalR Integration">
                <Typography variant="body1" paragraph>
                    Real-time updates are powered by SignalR.
                </Typography>

                <CodeBlock language="javascript">
                    {`import * as signalR from '@microsoft/signalr';

const connection = new signalR.HubConnectionBuilder()
    .withUrl('https://your-api/boardHub')
    .build();

await connection.start();`}
                </CodeBlock>
            </Section>

            <Section title="Best Practices">
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li>Use TypeScript for type safety</li>
                    <li>Follow naming conventions</li>
                    <li>Keep components small and focused</li>
                    <li>Write comprehensive tests</li>
                    <li>Document your code</li>
                </Box>
            </Section>
        </Paper>
    );
}
