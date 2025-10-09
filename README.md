# ProjectManagement

A full-stack project management application inspired by Trello, built with ASP.NET Core (backend) and React (frontend). It supports boards, columns, cards, invites, notifications, and real-time collaboration.

## Features
- User authentication and JWT-based authorization
- Board, column, and card management
- Role-based permissions and custom authorization policies
- Real-time updates via SignalR
- Notifications system
- Integration with Unsplash for images
- PostgreSQL database and Redis caching
- Modern React frontend with drag-and-drop, rich text editing, and MUI design

## Technologies
- **Backend:** ASP.NET Core 9, Entity Framework Core, Identity, AutoMapper, SignalR, PostgreSQL, Redis
- **Frontend:** React 19, Vite, MUI, Zustand, DnD Kit, Quill, React Router

## Getting Started

### Backend Setup
1. Install [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
2. Configure PostgreSQL and Redis (see `appsettings.json`)
3. Run database migrations:
   ```powershell
   dotnet ef database update
   ```
4. Start the backend:
   ```powershell
   dotnet run
   ```

### Frontend Setup
1. Navigate to `frontend/`
2. Install dependencies:
   ```powershell
   pnpm install
   ```
3. Start the frontend:
   ```powershell
   pnpm dev
   ```

## Redis Setup
If you do not have Redis running, you can use the provided folder `Redis-8.2.2-Windows-x64-msys2-with-Service`:

1. Open PowerShell and navigate to the folder:
   ```powershell
   cd .\Redis-8.2.2-Windows-x64-msys2-with-Service
   ```
2. Start Redis server:
   ```powershell
   .\redis-server.exe
   ```
3. (Optional) To install Redis as a Windows service:
   ```powershell
   .\redis-server.exe --service-install redis.windows.conf
   .\redis-server.exe --service-start
   ```

Make sure Redis is running before starting the backend server.

## API Endpoints
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive JWT
- `GET /api/boards` — List user boards
- `POST /api/boards` — Create a board
- `GET /api/boards/{boardId}` — Get board details
- `GET /api/boards/{boardId}/columns/{columnId}/cards/{cardId}` — Get card details
- `POST /api/boards/{boardId}/columns/{columnId}/cards` — Create a card

## Configuration
- Edit `appsettings.json` for database, Redis, JWT, and Unsplash keys
