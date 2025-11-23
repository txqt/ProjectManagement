import { Box, Typography, Paper, useTheme, alpha, Divider, Alert, Chip } from '@mui/material';
import { Code as CodeIcon, Api as ApiIcon, Hub as HubIcon, Storage as StorageIcon } from '@mui/icons-material';

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
                    <li><strong>Database:</strong> PostgreSQL 13+ with Code-First migrations</li>
                    <li><strong>Caching:</strong> Redis 6.0+ for distributed caching and rate limiting</li>
                    <li><strong>Frontend:</strong> React 18 with Material-UI (MUI) and Vite</li>
                    <li><strong>Real-time:</strong> SignalR for live updates and notifications</li>
                    <li><strong>State Management:</strong> Zustand for client-side state</li>
                    <li><strong>Authentication:</strong> JWT with ASP.NET Core Identity</li>
                    <li><strong>Logging:</strong> Serilog with file and console sinks</li>
                </Box>
            </Section>

            <Section title="API Reference">
                <Typography variant="body1" paragraph>
                    The REST API provides comprehensive endpoints for all operations. All endpoints require JWT authentication except login/register.
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                    <strong>Base URL:</strong> <code>https://localhost:7000/api</code>
                    <br />
                    <strong>Authentication:</strong> Include JWT token in <code>Authorization: Bearer {`{token}`}</code> header
                </Alert>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Authentication
                </Typography>
                <CodeBlock language="http">
                    {`POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh-token
POST /api/auth/logout
GET  /api/auth/me

# Example Login Request
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "...",
  "expiration": "2024-01-01T12:00:00Z"
}`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Boards
                </Typography>
                <CodeBlock language="http">
                    {`GET    /api/boards                    # Get all user's boards
GET    /api/boards/{id}                # Get board by ID
POST   /api/boards                     # Create new board
PUT    /api/boards/{id}                # Update board
DELETE /api/boards/{id}                # Delete board
POST   /api/boards/{id}/clone          # Clone board
GET    /api/boards/{id}/members        # Get board members
POST   /api/boards/{id}/members        # Add member to board
DELETE /api/boards/{id}/members/{userId} # Remove member
GET    /api/boards/templates           # Get board templates
POST   /api/boards/from-template/{templateId} # Create from template`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Columns
                </Typography>
                <CodeBlock language="http">
                    {`GET    /api/columns/board/{boardId}   # Get all columns in board
GET    /api/columns/{id}               # Get column by ID
POST   /api/columns                    # Create new column
PUT    /api/columns/{id}               # Update column
DELETE /api/columns/{id}               # Delete column
PUT    /api/columns/{id}/position      # Update column position`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Cards
                </Typography>
                <CodeBlock language="http">
                    {`GET    /api/cards/{id}                # Get card by ID
POST   /api/cards                      # Create new card
PUT    /api/cards/{id}                 # Update card
DELETE /api/cards/{id}                 # Delete card
PUT    /api/cards/{id}/move            # Move card to different column
POST   /api/cards/{id}/assign          # Assign user to card
DELETE /api/cards/{id}/assign/{userId} # Unassign user
POST   /api/cards/{id}/clone           # Clone card
GET    /api/cards/{id}/activity        # Get card activity log`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Comments
                </Typography>
                <CodeBlock language="http">
                    {`GET    /api/comments/card/{cardId}    # Get all comments for card
POST   /api/comments                   # Create comment
PUT    /api/comments/{id}              # Update comment
DELETE /api/comments/{id}              # Delete comment`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Attachments
                </Typography>
                <CodeBlock language="http">
                    {`GET    /api/attachments/card/{cardId} # Get all attachments
POST   /api/attachments                # Upload attachment
DELETE /api/attachments/{id}           # Delete attachment
GET    /api/attachments/{id}/download  # Download attachment`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Labels
                </Typography>
                <CodeBlock language="http">
                    {`GET    /api/labels/board/{boardId}    # Get all labels for board
POST   /api/labels                     # Create label
PUT    /api/labels/{id}                # Update label
DELETE /api/labels/{id}                # Delete label
POST   /api/cards/{cardId}/labels/{labelId} # Add label to card
DELETE /api/cards/{cardId}/labels/{labelId} # Remove label from card`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Checklists
                </Typography>
                <CodeBlock language="http">
                    {`GET    /api/checklists/card/{cardId}  # Get all checklists
POST   /api/checklists                 # Create checklist
PUT    /api/checklists/{id}            # Update checklist
DELETE /api/checklists/{id}            # Delete checklist
POST   /api/checklists/{id}/items      # Add checklist item
PUT    /api/checklists/items/{itemId}  # Update item
DELETE /api/checklists/items/{itemId}  # Delete item`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Notifications
                </Typography>
                <CodeBlock language="http">
                    {`GET    /api/notifications             # Get user notifications
PUT    /api/notifications/{id}/read    # Mark as read
PUT    /api/notifications/read-all     # Mark all as read
DELETE /api/notifications/{id}         # Delete notification`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Search
                </Typography>
                <CodeBlock language="http">
                    {`GET /api/search?query={query}&boardId={boardId}
# Search cards, boards, and users`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Activity Logs
                </Typography>
                <CodeBlock language="http">
                    {`GET /api/activitylog/board/{boardId}
GET /api/activitylog/card/{cardId}
# Get activity history`}
                </CodeBlock>
            </Section>

            <Section title="SignalR Real-time Communication">
                <Typography variant="body1" paragraph>
                    SignalR provides real-time updates for board changes. Connect to the hub to receive live notifications.
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                    <strong>Hub URL:</strong> <code>https://localhost:7000/hubs/board</code>
                    <br />
                    <strong>Authentication:</strong> Pass JWT token as query parameter: <code>?access_token={`{token}`}</code>
                </Alert>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Client Setup
                </Typography>
                <CodeBlock language="javascript">
                    {`import * as signalR from '@microsoft/signalr';

const connection = new signalR.HubConnectionBuilder()
    .withUrl('https://localhost:7000/hubs/board', {
        accessTokenFactory: () => localStorage.getItem('token')
    })
    .withAutomaticReconnect()
    .build();

// Start connection
await connection.start();
console.log('SignalR Connected');`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Hub Methods (Client → Server)
                </Typography>
                <CodeBlock language="javascript">
                    {`// Join a board room
await connection.invoke('JoinBoard', boardId);

// Leave a board room
await connection.invoke('LeaveBoard', boardId);

// Get users currently viewing the board
const users = await connection.invoke('GetUsersInBoard', boardId);`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Server Events (Server → Client)
                </Typography>
                <CodeBlock language="javascript">
                    {`// User joined board
connection.on('UserJoined', (userId, username) => {
    console.log(\`\${username} joined the board\`);
});

// User left board
connection.on('UserLeft', (userId, username) => {
    console.log(\`\${username} left the board\`);
});

// Card created
connection.on('CardCreated', (card) => {
    // Update UI with new card
});

// Card updated
connection.on('CardUpdated', (card) => {
    // Update card in UI
});

// Card deleted
connection.on('CardDeleted', (cardId) => {
    // Remove card from UI
});

// Card moved
connection.on('CardMoved', (cardId, newColumnId, newPosition) => {
    // Update card position
});

// Column created
connection.on('ColumnCreated', (column) => {
    // Add column to UI
});

// Column updated
connection.on('ColumnUpdated', (column) => {
    // Update column in UI
});

// Column deleted
connection.on('ColumnDeleted', (columnId) => {
    // Remove column from UI
});

// Comment added
connection.on('CommentAdded', (comment) => {
    // Add comment to card
});

// Board updated
connection.on('BoardUpdated', (board) => {
    // Update board details
});`}
                </CodeBlock>
            </Section>

            <Section title="Redis Caching">
                <Typography variant="body1" paragraph>
                    Redis is used for distributed caching and rate limiting. The application uses the following caching patterns:
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Cache Keys
                </Typography>
                <CodeBlock language="text">
                    {`board:{boardId}                    # Board details
board:{boardId}:columns            # Board columns
board:{boardId}:cards              # Board cards
user:{userId}:boards               # User's boards
card:{cardId}                      # Card details
card:{cardId}:comments             # Card comments
board:{boardId}:members            # Board members`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Cache Invalidation
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    The <code>CacheInvalidationService</code> automatically invalidates related caches when data changes:
                </Typography>
                <CodeBlock language="csharp">
                    {`// When a card is updated, invalidate:
// - card:{cardId}
// - board:{boardId}:cards
// - Related user caches

// When a board is updated, invalidate:
// - board:{boardId}
// - All related entity caches
// - User board lists`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Rate Limiting
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Redis-based rate limiting prevents API abuse:
                </Typography>
                <CodeBlock language="text">
                    {`Default: 100 requests per minute per user
Configurable per endpoint via [RateLimit] attribute`}
                </CodeBlock>
            </Section>

            <Section title="Frontend Structure">
                <Typography variant="body1" paragraph>
                    The React frontend follows a modular architecture:
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    API Service Layer
                </Typography>
                <CodeBlock language="javascript">
                    {`// src/services/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_ROOT,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
});

export default api;`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Zustand Store
                </Typography>
                <CodeBlock language="javascript">
                    {`// src/stores/boardStore.js
import { create } from 'zustand';

const useBoardStore = create((set) => ({
    boards: [],
    currentBoard: null,
    columns: [],
    cards: [],
    
    setBoards: (boards) => set({ boards }),
    setCurrentBoard: (board) => set({ currentBoard: board }),
    addCard: (card) => set((state) => ({
        cards: [...state.cards, card]
    })),
    updateCard: (cardId, updates) => set((state) => ({
        cards: state.cards.map(c => 
            c.id === cardId ? { ...c, ...updates } : c
        )
    })),
}));

export default useBoardStore;`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Custom Hooks
                </Typography>
                <CodeBlock language="javascript">
                    {`// src/hooks/useSignalR.js
import { useEffect } from 'react';
import { connection } from '../services/signalr';

export const useSignalR = (boardId, handlers) => {
    useEffect(() => {
        if (!boardId) return;
        
        connection.invoke('JoinBoard', boardId);
        
        Object.entries(handlers).forEach(([event, handler]) => {
            connection.on(event, handler);
        });
        
        return () => {
            connection.invoke('LeaveBoard', boardId);
            Object.keys(handlers).forEach(event => {
                connection.off(event);
            });
        };
    }, [boardId]);
};`}
                </CodeBlock>
            </Section>

            <Section title="Permission System">
                <Typography variant="body1" paragraph>
                    The application uses a role-based permission system:
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Board Roles
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li><strong>Owner:</strong> Full control, can delete board</li>
                    <li><strong>Admin:</strong> Can manage members and settings</li>
                    <li><strong>Member:</strong> Can create and edit cards</li>
                    <li><strong>Viewer:</strong> Read-only access</li>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Using Permissions
                </Typography>
                <CodeBlock language="csharp">
                    {`// In controllers
[Authorize(Policy = "BoardMember")]
public async Task<IActionResult> CreateCard(CreateCardDto dto)
{
    // Only board members can create cards
}

[Authorize(Policy = "BoardAdmin")]
public async Task<IActionResult> AddMember(int boardId, string userId)
{
    // Only admins can add members
}`}
                </CodeBlock>
            </Section>

            <Section title="Best Practices">
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <li><strong>API Calls:</strong> Always handle errors and loading states</li>
                    <li><strong>SignalR:</strong> Implement reconnection logic for network failures</li>
                    <li><strong>State Management:</strong> Keep Zustand stores focused and modular</li>
                    <li><strong>Caching:</strong> Leverage Redis cache for frequently accessed data</li>
                    <li><strong>Security:</strong> Never expose JWT secrets, use HTTPS in production</li>
                    <li><strong>Performance:</strong> Use pagination for large lists</li>
                    <li><strong>Testing:</strong> Write unit tests for services and components</li>
                    <li><strong>Logging:</strong> Use Serilog for structured logging in backend</li>
                </Box>
            </Section>

            <Section title="Development Workflow">
                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Running Locally
                </Typography>
                <CodeBlock language="bash">
                    {`# Backend
cd src/Web
dotnet run

# Frontend
cd src/Web/frontend
pnpm dev

# Redis (required)
docker run -d -p 6379:6379 redis

# PostgreSQL (required)
# Configure connection string in appsettings.json`}
                </CodeBlock>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                    Database Migrations
                </Typography>
                <CodeBlock language="bash">
                    {`# Create migration
dotnet ef migrations add MigrationName

# Apply migrations
dotnet ef database update

# Rollback migration
dotnet ef database update PreviousMigrationName`}
                </CodeBlock>
            </Section>

            <Alert severity="success" sx={{ mt: 4 }}>
                <strong>Need Help?</strong> Check the source code, review existing implementations, or refer to the official documentation for ASP.NET Core, React, and SignalR.
            </Alert>
        </Paper>
    );
}
