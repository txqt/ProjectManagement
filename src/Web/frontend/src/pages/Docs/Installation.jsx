import { Box, Typography, Paper, useTheme, alpha, Divider, Alert } from '@mui/material';
import { Terminal as TerminalIcon, CheckCircle as CheckIcon } from '@mui/icons-material';

export default function Installation() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const CodeBlock = ({ children, language = 'bash' }) => (
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
                <TerminalIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption">{language}</Typography>
            </Box>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {children}
            </pre>
        </Paper>
    );

    const Section = ({ title, children }) => (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckIcon sx={{ color: 'success.main' }} />
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
                Installation & Upgrading
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Complete guide to install and upgrade Project Management system
            </Typography>

            <Divider sx={{ mb: 4 }} />

            <Section title="System Requirements">
                <Typography variant="body1" paragraph>
                    Before installing, ensure your system meets the following requirements:
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                    <li><strong>Backend:</strong> .NET 8.0 SDK or later</li>
                    <li><strong>Frontend:</strong> Node.js 18.x or later</li>
                    <li><strong>Database:</strong> SQL Server 2019 or later / PostgreSQL 13+</li>
                    <li><strong>Package Manager:</strong> pnpm (recommended) or npm</li>
                    <li><strong>Memory:</strong> Minimum 4GB RAM (8GB recommended)</li>
                </Box>
            </Section>

            <Section title="Backend Installation">
                <Typography variant="body1" paragraph>
                    <strong>Step 1:</strong> Clone the repository
                </Typography>
                <CodeBlock>
                    {`git clone https://github.com/your-org/project-management.git
cd project-management/src/Web`}
                </CodeBlock>

                <Typography variant="body1" paragraph sx={{ mt: 3 }}>
                    <strong>Step 2:</strong> Configure database connection
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Update <code>appsettings.json</code> with your database connection string:
                </Typography>
                <CodeBlock language="json">
                    {`{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ProjectManagement;Trusted_Connection=True;"
  }
}`}
                </CodeBlock>

                <Typography variant="body1" paragraph sx={{ mt: 3 }}>
                    <strong>Step 3:</strong> Restore dependencies and run migrations
                </Typography>
                <CodeBlock>
                    {`dotnet restore
dotnet ef database update
dotnet run`}
                </CodeBlock>

                <Alert severity="info" sx={{ mt: 2 }}>
                    The backend API will be available at <code>https://localhost:7000</code>
                </Alert>
            </Section>

            <Section title="Frontend Installation">
                <Typography variant="body1" paragraph>
                    <strong>Step 1:</strong> Navigate to frontend directory
                </Typography>
                <CodeBlock>
                    {`cd frontend`}
                </CodeBlock>

                <Typography variant="body1" paragraph sx={{ mt: 3 }}>
                    <strong>Step 2:</strong> Install dependencies
                </Typography>
                <CodeBlock>
                    {`# Using pnpm (recommended)
pnpm install

# Or using npm
npm install`}
                </CodeBlock>

                <Typography variant="body1" paragraph sx={{ mt: 3 }}>
                    <strong>Step 3:</strong> Configure environment variables
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Create <code>.env.development</code> file:
                </Typography>
                <CodeBlock language="env">
                    {`VITE_API_ROOT=https://localhost:7000
VITE_SIGNALR_HUB_URL=https://localhost:7000/boardHub`}
                </CodeBlock>

                <Typography variant="body1" paragraph sx={{ mt: 3 }}>
                    <strong>Step 4:</strong> Start development server
                </Typography>
                <CodeBlock>
                    {`pnpm dev`}
                </CodeBlock>

                <Alert severity="success" sx={{ mt: 2 }}>
                    The frontend will be available at <code>http://localhost:5173</code>
                </Alert>
            </Section>

            <Section title="Docker Installation">
                <Typography variant="body1" paragraph>
                    For a quick setup using Docker:
                </Typography>
                <CodeBlock>
                    {`# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f`}
                </CodeBlock>
            </Section>

            <Section title="Upgrading">
                <Typography variant="body1" paragraph>
                    To upgrade to the latest version:
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Backend Upgrade
                </Typography>
                <CodeBlock>
                    {`# Pull latest changes
git pull origin main

# Restore dependencies
dotnet restore

# Apply new migrations
dotnet ef database update

# Restart the application
dotnet run`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Frontend Upgrade
                </Typography>
                <CodeBlock>
                    {`# Pull latest changes
git pull origin main

# Update dependencies
cd frontend
pnpm install

# Rebuild
pnpm build`}
                </CodeBlock>

                <Alert severity="warning" sx={{ mt: 2 }}>
                    <strong>Important:</strong> Always backup your database before upgrading. Review the changelog for breaking changes.
                </Alert>
            </Section>

            <Section title="Troubleshooting">
                <Typography variant="body1" paragraph>
                    Common issues and solutions:
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                    <li>
                        <strong>Port already in use:</strong> Change the port in <code>launchSettings.json</code> (backend) or <code>vite.config.js</code> (frontend)
                    </li>
                    <li>
                        <strong>Database connection failed:</strong> Verify your connection string and ensure SQL Server is running
                    </li>
                    <li>
                        <strong>CORS errors:</strong> Check that the API URL in frontend environment variables matches your backend URL
                    </li>
                    <li>
                        <strong>SignalR connection issues:</strong> Ensure WebSocket support is enabled on your server
                    </li>
                </Box>
            </Section>
        </Paper>
    );
}
