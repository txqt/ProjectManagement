# Project Management

A comprehensive project management API built with **ASP.NET Core 9**, inspired by **Trello**. Features include real-time collaboration, role-based permissions, board management, and activity tracking.

## 🚀 Features

### Authentication & Authorization

* JWT-based authentication
* Role-based access control (SuperAdmin, Admin, User)
* Board-level permissions (Owner, Admin, Member, Viewer)
* Custom permission system with hierarchical roles

### Board Management

* Public and private boards
* Board members with customizable roles
* Board invitations and join requests
* Share links with token-based access
* Board activity logging

### Kanban Functionality

* Columns and cards with drag-and-drop support
* LexoRank algorithm for efficient ordering
* Card assignments and member management
* Comments and attachments
* Rich text descriptions

### Real-time Collaboration

* SignalR integration for live updates
* User presence tracking
* Real-time notifications
* Broadcast board changes to all members

### Advanced Features

* Redis caching for performance
* Rate limiting with Redis
* Activity log system with cleanup
* Notification system with multiple types
* Search functionality (boards, cards, users)
* Unsplash integration for cover images

## 🔧 Technology Stack

* **Framework**: ASP.NET Core 9
* **Database**: PostgreSQL 15
* **Cache/Rate Limiting**: Redis 7
* **ORM**: Entity Framework Core 9
* **Authentication**: ASP.NET Core Identity + JWT
* **Real-time**: SignalR
* **Mapping**: AutoMapper
* **Validation**: FluentValidation
* **Logging**: Serilog

## 📋 Prerequisites

* [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
* [PostgreSQL 15+](https://www.postgresql.org/download/)
* [Redis 7+](https://redis.io/download) *(optional for development)*
* [Docker & Docker Compose](https://www.docker.com/get-started)

## 🔧 Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ProjectManagement
```

### 2. Configure Application Settings

Create `appsettings.Development.json` from the example:

```bash
cp src/Web/appsettings.Development.json.example src/Web/appsettings.Development.json
```

Update the configuration:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=127.0.0.1;Port=5432;Database=ProjectManagement;Username=postgres;Password=your_password;",
    "Redis": "localhost:6379"
  },
  "Jwt": {
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!@#$%^&*()",
    "Issuer": "TrelloCloneApi",
    "Audience": "TrelloCloneClient"
  },
  "Unsplash": {
    "AccessKey": "your_unsplash_access_key"
  },
  "ClientUrl": "http://localhost:3000"
}
```

### 3. Setup PostgreSQL Database

```bash
psql -U postgres
CREATE DATABASE ProjectManagement;
\q
```

### 4. Setup Redis (Optional)

**Windows:**

```powershell
cd redis
.\redis-server.exe
```

**Linux/macOS:**

```bash
redis-server
```

### 5. Apply Database Migrations

```bash
cd src/Web
dotnet ef database update
```

### 6. Run the Application

```bash
dotnet run
```

The API will be available at:

* HTTP: `http://localhost:5137`
* HTTPS: `https://localhost:5000`
* Swagger UI: `https://localhost:5000/swagger`

## 🐳 Docker Deployment

### Development Environment

Run the full stack:

```bash
docker-compose up -d
```

Services:

* Backend: [http://localhost:5000](http://localhost:5000)
* Frontend: [http://localhost:3000](http://localhost:3000)
* PostgreSQL: localhost:5432
* Redis: localhost:6379

Stop services:

```bash
docker-compose down
```

### Production Environment

1. **Configure Environment Variables**

   ```bash
   cp .env.example .env
   ```

   Update values:

   ```env
   POSTGRES_DB=projectmanagement
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_secure_password

   REDIS_PASSWORD=your_redis_password

   JWT_SECRET_KEY=your_super_secret_key_at_least_32_characters
   JWT_ISSUER=TrelloCloneApi
   JWT_AUDIENCE=TrelloCloneClient

   CLIENT_URL=https://yourdomain.com
   UNSPLASH_ACCESS_KEY=your_unsplash_key
   ```

2. **SSL Certificates**

   ```
   nginx/ssl/
     ├── fullchain.pem
     └── privkey.pem
   ```

3. **Deploy**

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **View Logs**

   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

5. **Stop Services**

   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

## 🔑 Key Features Explained

### Permission System

Two-level permission system:

1. **System-level permissions** – global (manage users, view all boards)
2. **Board-level permissions** – per board (based on membership role)

### Role Hierarchy

* **System Roles:** SuperAdmin > Admin > User
* **Board Roles:** Owner > Admin > Member > Viewer

### LexoRank Ordering

Efficient drag-and-drop ordering without reordering all items.

### Rate Limiting

* Global middleware-based limiting
* Endpoint-level control with attributes
* Redis-backed distributed rate limiting

### Caching Strategy

* Board data cached for 10 minutes
* User-specific cache keys
* Automatic invalidation on updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

Licensed under **AGPL-3.0** – see `LICENSE` file.

## 👥 Authors

* **Ho Van Thanh** – Initial work

## 🙏 Acknowledgments

* Inspired by Trello
* LexoRank algorithm for ordering
* ASP.NET Core community
