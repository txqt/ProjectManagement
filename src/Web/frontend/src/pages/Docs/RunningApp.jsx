import { Box, Typography, Paper, useTheme, alpha, Divider, Alert, Chip } from '@mui/material';
import { Warning as WarningIcon, Info as InfoIcon, CheckCircle as CheckIcon } from '@mui/icons-material';

export default function RunningStore() {
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
                Running Your App
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Comprehensive guide to managing and operating your Project Management instance
            </Typography>

            <Divider sx={{ mb: 4 }} />

            <Section title="Production Deployment">
                <Typography variant="body1" paragraph>
                    Deploy your Project Management system to production with these steps:
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    1. Build Frontend for Production
                </Typography>
                <CodeBlock>
                    {`cd frontend
pnpm build

# Output will be in the 'dist' directory`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    2. Configure Production Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Update <code>appsettings.Production.json</code>:
                </Typography>
                <CodeBlock language="json">
                    {`{
  "ConnectionStrings": {
    "DefaultConnection": "Your-Production-Database-Connection"
  },
  "Jwt": {
    "Key": "Your-Secure-Production-Key",
    "Issuer": "https://your-domain.com",
    "Audience": "https://your-domain.com"
  },
  "Cors": {
    "AllowedOrigins": ["https://your-domain.com"]
  }
}`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    3. Publish Backend
                </Typography>
                <CodeBlock>
                    {`dotnet publish -c Release -o ./publish

# Run in production
cd publish
dotnet ProjectManagement.dll`}
                </CodeBlock>

                <Alert severity="warning" sx={{ mt: 2 }}>
                    <strong>Security:</strong> Always use HTTPS in production and keep your JWT secret key secure!
                </Alert>
            </Section>

            <Section title="Using Docker">
                <Typography variant="body1" paragraph>
                    Deploy with Docker for easier management and scalability:
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Build Docker Images
                </Typography>
                <CodeBlock>
                    {`# Build backend image
docker build -t project-management-api .

# Build frontend image
cd frontend
docker build -t project-management-web .`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Docker Compose Setup
                </Typography>
                <CodeBlock language="yaml">
                    {`version: '3.8'
services:
  db:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=YourStrong@Password
    ports:
      - "1433:1433"
    volumes:
      - sqldata:/var/opt/mssql

  api:
    image: project-management-api
    depends_on:
      - db
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Server=db;Database=ProjectManagement;User=sa;Password=YourStrong@Password
    ports:
      - "7000:80"

  web:
    image: project-management-web
    depends_on:
      - api
    ports:
      - "80:80"

volumes:
  sqldata:`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Run with Docker Compose
                </Typography>
                <CodeBlock>
                    {`docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down`}
                </CodeBlock>
            </Section>

            <Section title="Database Management">
                <Typography variant="body1" paragraph>
                    Manage your database effectively:
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Backup Database
                </Typography>
                <CodeBlock>
                    {`# SQL Server backup
BACKUP DATABASE ProjectManagement 
TO DISK = 'C:\\Backups\\ProjectManagement.bak'
WITH FORMAT, MEDIANAME = 'ProjectManagementBackup';

# Or use command line
sqlcmd -S localhost -Q "BACKUP DATABASE ProjectManagement TO DISK='backup.bak'"`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Restore Database
                </Typography>
                <CodeBlock>
                    {`RESTORE DATABASE ProjectManagement 
FROM DISK = 'C:\\Backups\\ProjectManagement.bak'
WITH REPLACE;`}
                </CodeBlock>

                <Alert severity="info" sx={{ mt: 2 }}>
                    <strong>Tip:</strong> Set up automated daily backups to prevent data loss.
                </Alert>
            </Section>

            <Section title="Performance Optimization">
                <Typography variant="body1" paragraph>
                    Optimize your instance for better performance:
                </Typography>

                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li>
                        <strong>Enable Response Compression:</strong> Already configured in the backend
                    </li>
                    <li>
                        <strong>Use CDN:</strong> Serve static assets from a CDN for faster load times
                    </li>
                    <li>
                        <strong>Database Indexing:</strong> Ensure proper indexes on frequently queried columns
                    </li>
                    <li>
                        <strong>Caching:</strong> Implement Redis caching for frequently accessed data
                    </li>
                    <li>
                        <strong>Connection Pooling:</strong> Configure appropriate connection pool sizes
                    </li>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Redis Caching Setup
                </Typography>
                <CodeBlock>
                    {`# Install Redis
docker run -d -p 6379:6379 redis

# Add to appsettings.json
{
  "Redis": {
    "Configuration": "localhost:6379"
  }
}`}
                </CodeBlock>
            </Section>

            <Section title="Monitoring & Logging">
                <Typography variant="body1" paragraph>
                    Keep track of your application health:
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Application Insights
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Configure Application Insights for monitoring:
                </Typography>
                <CodeBlock language="json">
                    {`{
  "ApplicationInsights": {
    "InstrumentationKey": "your-instrumentation-key"
  }
}`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Log Levels
                </Typography>
                <CodeBlock language="json">
                    {`{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Microsoft.Hosting.Lifetime": "Information"
    }
  }
}`}
                </CodeBlock>

                <Alert severity="info" sx={{ mt: 2 }}>
                    Monitor key metrics: Response times, error rates, database query performance, and SignalR connection health.
                </Alert>
            </Section>

            <Section title="Security Best Practices">
                <Typography variant="body1" paragraph>
                    Ensure your deployment is secure:
                </Typography>

                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li><strong>HTTPS Only:</strong> Force HTTPS for all connections</li>
                    <li><strong>Strong JWT Secrets:</strong> Use long, random keys (minimum 256 bits)</li>
                    <li><strong>CORS Configuration:</strong> Only allow trusted origins</li>
                    <li><strong>Rate Limiting:</strong> Prevent abuse with rate limiting</li>
                    <li><strong>SQL Injection Protection:</strong> Use parameterized queries (already implemented)</li>
                    <li><strong>XSS Protection:</strong> Sanitize user inputs</li>
                    <li><strong>Regular Updates:</strong> Keep dependencies up to date</li>
                </Box>

                <Alert severity="error" sx={{ mt: 2 }}>
                    <strong>Critical:</strong> Never commit secrets or connection strings to version control!
                </Alert>
            </Section>

            <Section title="Scaling Considerations">
                <Typography variant="body1" paragraph>
                    Scale your application as your user base grows:
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Horizontal Scaling
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li>Use a load balancer (nginx, Azure Load Balancer, AWS ELB)</li>
                    <li>Configure sticky sessions for SignalR</li>
                    <li>Use Redis backplane for SignalR scale-out</li>
                    <li>Separate database server from application servers</li>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Vertical Scaling
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li>Increase server CPU and RAM</li>
                    <li>Optimize database server resources</li>
                    <li>Use SSD storage for better I/O performance</li>
                </Box>
            </Section>

            <Section title="Maintenance Tasks">
                <Typography variant="body1" paragraph>
                    Regular maintenance keeps your system healthy:
                </Typography>

                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li><strong>Daily:</strong> Monitor logs and error rates</li>
                    <li><strong>Weekly:</strong> Review performance metrics and database size</li>
                    <li><strong>Monthly:</strong> Update dependencies and security patches</li>
                    <li><strong>Quarterly:</strong> Review and optimize database indexes</li>
                    <li><strong>Annually:</strong> Audit security configurations and access controls</li>
                </Box>
            </Section>
        </Paper>
    );
}
