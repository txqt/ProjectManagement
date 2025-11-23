import { Box, Typography, Paper, useTheme, alpha, Divider, Alert, Chip } from '@mui/material';
import { GitHub as GitHubIcon, BugReport as BugIcon, Lightbulb as IdeaIcon } from '@mui/icons-material';

export default function Contribute() {
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
                Contribute
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Help us make Project Management better for everyone
            </Typography>

            <Divider sx={{ mb: 4 }} />

            <Alert severity="success" sx={{ mb: 4 }}>
                We welcome contributions from developers of all skill levels! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.
            </Alert>

            <Section title="Ways to Contribute">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <BugIcon sx={{ color: 'error.main', mt: 0.5 }} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>Report Bugs</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Found a bug? Open an issue on GitHub with detailed steps to reproduce.
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <IdeaIcon sx={{ color: 'warning.main', mt: 0.5 }} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>Suggest Features</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Have an idea? Create a feature request and discuss it with the community.
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <GitHubIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>Submit Pull Requests</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Fix bugs, add features, or improve documentation through pull requests.
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Section>

            <Section title="Getting Started">
                <Typography variant="body1" paragraph>
                    <strong>Step 1:</strong> Fork the repository
                </Typography>
                <CodeBlock>
                    {`# Fork on GitHub, then clone your fork
git clone https://github.com/txqt/ProjectManagement.git
cd ProjectManagement`}
                </CodeBlock>

                <Typography variant="body1" paragraph sx={{ mt: 3 }}>
                    <strong>Step 2:</strong> Create a feature branch
                </Typography>
                <CodeBlock>
                    {`git checkout -b feature/my-awesome-feature`}
                </CodeBlock>

                <Typography variant="body1" paragraph sx={{ mt: 3 }}>
                    <strong>Step 3:</strong> Make your changes
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Write clean, well-documented code following our coding standards.
                </Typography>

                <Typography variant="body1" paragraph sx={{ mt: 3 }}>
                    <strong>Step 4:</strong> Test your changes
                </Typography>
                <CodeBlock>
                    {`# Run backend tests
dotnet test

# Run frontend tests
cd frontend
pnpm test`}
                </CodeBlock>

                <Typography variant="body1" paragraph sx={{ mt: 3 }}>
                    <strong>Step 5:</strong> Commit and push
                </Typography>
                <CodeBlock>
                    {`git add .
git commit -m "feat: add awesome feature"
git push origin feature/my-awesome-feature`}
                </CodeBlock>

                <Typography variant="body1" paragraph sx={{ mt: 3 }}>
                    <strong>Step 6:</strong> Create a Pull Request
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Go to GitHub and create a pull request from your branch to the main repository.
                </Typography>
            </Section>

            <Section title="Coding Standards">
                <Typography variant="body1" paragraph>
                    Please follow these guidelines:
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Frontend (React)
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li>Use functional components with hooks</li>
                    <li>Follow the existing file structure</li>
                    <li>Use Material-UI components consistently</li>
                    <li>Write meaningful component and variable names</li>
                    <li>Add PropTypes or TypeScript types</li>
                    <li>Keep components focused and reusable</li>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Backend (C#)
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li>Follow C# naming conventions (PascalCase for public members)</li>
                    <li>Use async/await for asynchronous operations</li>
                    <li>Add XML documentation comments for public APIs</li>
                    <li>Handle exceptions appropriately</li>
                    <li>Use dependency injection</li>
                    <li>Write unit tests for new features</li>
                </Box>
            </Section>

            <Section title="Commit Message Guidelines">
                <Typography variant="body1" paragraph>
                    Use conventional commit messages:
                </Typography>
                <CodeBlock>
                    {`feat: add new feature
fix: fix bug in component
docs: update documentation
style: format code
refactor: refactor existing code
test: add tests
chore: update dependencies`}
                </CodeBlock>
            </Section>

            <Section title="Pull Request Process">
                <Typography variant="body1" paragraph>
                    When submitting a pull request:
                </Typography>
                <Box component="ol" sx={{ pl: 3, mb: 2 }}>
                    <li>Ensure all tests pass</li>
                    <li>Update documentation if needed</li>
                    <li>Add a clear description of your changes</li>
                    <li>Link related issues</li>
                    <li>Request review from maintainers</li>
                    <li>Address review feedback promptly</li>
                </Box>

                <Alert severity="info" sx={{ mt: 2 }}>
                    Pull requests are usually reviewed within 2-3 business days. Be patient and responsive to feedback!
                </Alert>
            </Section>

            <Section title="Code of Conduct">
                <Typography variant="body1" paragraph>
                    We are committed to providing a welcoming and inclusive environment:
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li>Be respectful and considerate</li>
                    <li>Welcome newcomers and help them get started</li>
                    <li>Accept constructive criticism gracefully</li>
                    <li>Focus on what is best for the community</li>
                    <li>Show empathy towards other community members</li>
                </Box>
            </Section>

            <Section title="Need Help?">
                <Typography variant="body1" paragraph>
                    If you have questions or need assistance:
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li>Check existing issues and discussions on GitHub</li>
                    <li>Read the documentation thoroughly</li>
                    <li>Ask questions in GitHub Discussions</li>
                    <li>Join our community chat (if available)</li>
                </Box>

                <Alert severity="success" sx={{ mt: 2 }}>
                    <strong>Thank you for contributing!</strong> Every contribution, no matter how small, helps make this project better.
                </Alert>
            </Section>
        </Paper>
    );
}
