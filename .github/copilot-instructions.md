# Copilot Instructions for ProjectManagement

This guide enables AI coding agents to work productively in the ProjectManagement codebase. It covers architecture, workflows, conventions, and integration points specific to this project.

## Architecture Overview
- **Backend:** ASP.NET Core 9 (see `src/Web/`), using Entity Framework Core, Identity, AutoMapper, SignalR, PostgreSQL, and Redis.
  - Main entry: `Program.cs` configures services, authentication, authorization, SignalR, Redis, and Swagger.
  - Data access: `Data/ApplicationDbContext.cs` defines all major entities and relationships (Board, Column, Card, Member, Invite, Notification, etc.).
  - Domain models: `Models/Domain/Entities/` contains core business objects.
  - Controllers: `Controllers/` exposes RESTful API endpoints for boards, cards, columns, invites, notifications, permissions, users, and Unsplash integration.
  - Services: `Services/` implements business logic and cross-cutting concerns (e.g., notifications, invites, caching).
  - Authorization: Custom permission system in `Authorization/` (see `PermissionAuthorizationHandler.cs`, `PermissionPolicyProvider.cs`).
  - Real-time: SignalR hub in `Hubs/BoardHub.cs` for board collaboration.
  - Mappings: AutoMapper profiles and resolvers in `Mappings/`.
  - Middleware: Custom logging in `Middleware/PermissionLoggingMiddleware.cs`.
- **Frontend:** React 19 app in `src/Web/frontend/` (Vite, MUI, Zustand, DnD Kit, Quill).
  - Entry: `index.html`, config: `vite.config.js`, state: Zustand, UI: MUI, drag-and-drop: DnD Kit.

## Developer Workflows
- **Backend:**
  - Build & run: `dotnet run` in `src/Web/`
  - Migrations: `dotnet ef database update` (requires PostgreSQL and Redis running)
  - Configuration: Edit `appsettings.json` for DB, Redis, JWT, Unsplash keys
  - Redis: Use `Redis-8.2.2-Windows-x64-msys2-with-Service/` for local dev; start with `.\redis-server.exe`
  - Data seeding: On startup, `DataSeeder.InitializeDatabase(app)` seeds roles and initial data
- **Frontend:**
  - Install deps: `pnpm install` in `src/Web/frontend/`
  - Run dev server: `pnpm dev`

## Project-Specific Conventions
- **Authorization:**
  - Role-based and permission-based policies (see `Permissions.cs`, custom attributes in `Authorization/`)
  - Use `[RequireBoardPermission]` and `[RequireSystemPermission]` for controller actions
- **Entity Relationships:**
  - Board, Column, Card, Member, Invite, Notification: see `ApplicationDbContext.cs` for constraints and navigation properties
  - List<string> properties (e.g., `ColumnOrderIds`, `CardOrderIds`) are stored as JSON in DB
- **Notifications:**
  - Notification types and cleanup handled by background service (`NotificationCleanupService`)
- **SignalR:**
  - Real-time board updates via `/hubs/board` (see `BoardHub.cs`)
  - JWT tokens passed via query string for SignalR authentication
- **API Patterns:**
  - RESTful endpoints, JWT auth, see `Controllers/` for examples
  - Use Swagger UI in development for API exploration

## Integration Points
- **External:**
  - Unsplash API for images (configure keys in `appsettings.json`)
  - PostgreSQL and Redis required for backend
- **Frontend/Backend Communication:**
  - REST API and SignalR hub

## Key Files & Directories
- `src/Web/Program.cs` — app startup, DI, middleware
- `src/Web/Data/ApplicationDbContext.cs` — entity definitions
- `src/Web/Controllers/` — API endpoints
- `src/Web/Services/` — business logic
- `src/Web/Authorization/` — permissions system
- `src/Web/Hubs/BoardHub.cs` — real-time collaboration
- `src/Web/frontend/` — React app

---

For questions or unclear conventions, review the above files or ask for clarification. Update this guide as new patterns emerge.
