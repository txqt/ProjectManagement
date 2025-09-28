using Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using ProjectManagement.Authorization;
using ProjectManagement.Hubs;
using ProjectManagement.Mappings;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Services;
using ProjectManagement.Services.Interfaces;
using System.Reflection;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

// Add Entity Framework
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequiredLength = 6;
    options.Password.RequiredUniqueChars = 1;

    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // User settings
    options.User.AllowedUserNameCharacters =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

builder.Services.AddSignalR();

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"] ?? throw new InvalidOperationException("JWT Key not found"));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/board"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Add Authorization with custom permission system
builder.Services.AddAuthorization();
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(Program).Assembly);

// Add Application Services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IBoardService, BoardService>();
builder.Services.AddScoped<IColumnService, ColumnService>();
builder.Services.AddScoped<ICardService, CardService>();
builder.Services.AddSingleton<BoardPresenceTracker>();
builder.Services.AddScoped<IBoardNotificationService, BoardNotificationService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000") // React dev server
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Trello Clone API", Version = "v1" });

    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHub<BoardHub>("/hubs/board");

// Initialize database and roles
await InitializeDatabase(app);

app.Run();

// Helper method to initialize database
static async Task InitializeDatabase(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;

    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        // Ensure database is created
        await context.Database.EnsureCreatedAsync();

        // Create roles
        await CreateRoles(roleManager);

        // Create admin user
        await SeedSampleData(context, userManager);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while initializing the database.");
    }
}

static async Task CreateRoles(RoleManager<IdentityRole> roleManager)
{
    var roles = new Dictionary<string, string[]>
    {
        {
            "SuperAdmin",
            Permissions.GetAllPermissions().ToArray() // All permissions
        },
        {
            "Admin",
            new[] {
                // System permissions (limited)
                Permissions.System.ViewAllUsers,
                Permissions.System.ViewSystemStats,
                // All board-level permissions 
                Permissions.Boards.Create,
                Permissions.Boards.View,
                Permissions.Boards.Edit, // Can edit any board if they're member
            }.Concat(Permissions.GetBoardLevelPermissions().Where(p =>
                p != Permissions.Boards.Delete)) // Admin can't delete boards
            .ToArray()
        },
        {
            "User",
            new[] {
                // Basic system permissions
                Permissions.Boards.Create, // Can create new boards
                // Basic board-level permissions (will be controlled by board membership)
                Permissions.Boards.View,
                Permissions.Columns.View,
                Permissions.Cards.View,
                Permissions.Cards.Create,
                Permissions.Cards.Edit,
                Permissions.Cards.Comment,
            }
        },
        {
            "Viewer", // Read-only role
            new[] {
                Permissions.Boards.View,
                Permissions.Columns.View,
                Permissions.Cards.View,
            }
        }
    };

    foreach (var (roleName, permissions) in roles)
    {
        if (!await roleManager.RoleExistsAsync(roleName))
        {
            var role = new IdentityRole(roleName);
            await roleManager.CreateAsync(role);

            // Add permissions to role
            foreach (var permission in permissions)
            {
                await roleManager.AddClaimAsync(role,
                    new System.Security.Claims.Claim("permission", permission));
            }
        }
    }
}

static async Task SeedSampleData(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
{
    // Create sample users with different roles
    var sampleUsers = new[]
    {
        new { Email = "superadmin@test.com", UserName = "superadmin", Password = "Test123!", Role = "SuperAdmin" },
        new { Email = "admin@test.com", UserName = "admin", Password = "Test123!", Role = "Admin" },
        new { Email = "alice@test.com", UserName = "alice", Password = "Test123!", Role = "User" },
        new { Email = "bob@test.com", UserName = "bob", Password = "Test123!", Role = "User" },
        new { Email = "viewer@test.com", UserName = "viewer", Password = "Test123!", Role = "Viewer" }
    };

    var createdUsers = new List<(ApplicationUser User, string Role)>();

    foreach (var userData in sampleUsers)
    {
        var existingUser = await userManager.FindByEmailAsync(userData.Email);
        if (existingUser == null)
        {
            var user = new ApplicationUser
            {
                UserName = userData.UserName,
                Email = userData.Email,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(user, userData.Password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, userData.Role);
                createdUsers.Add((user, userData.Role));
            }
        }
        else
        {
            var roles = await userManager.GetRolesAsync(existingUser);
            createdUsers.Add((existingUser, roles.FirstOrDefault() ?? "User"));
        }
    }

    // Create sample boards with different permission scenarios
    if (!context.Boards.Any() && createdUsers.Any())
    {
        var alice = createdUsers.FirstOrDefault(u => u.User.UserName == "alice").User;
        var bob = createdUsers.FirstOrDefault(u => u.User.UserName == "bob").User;
        var viewer = createdUsers.FirstOrDefault(u => u.User.UserName == "viewer").User;

        if (alice != null)
        {
            // Alice's private board
            var privateBoard = new Board
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Alice's Private Project",
                Description = "A private board owned by Alice",
                Type = "private",
                OwnerId = alice.Id,
                Created = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };
            context.Boards.Add(privateBoard);

            // Alice's public board
            var publicBoard = new Board
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Team Collaboration Board",
                Description = "A public board for team collaboration",
                Type = "public",
                OwnerId = alice.Id,
                Created = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };
            context.Boards.Add(publicBoard);

            // Add Bob as admin to public board
            if (bob != null)
            {
                var bobMembership = new BoardMember
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = publicBoard.Id,
                    UserId = bob.Id,
                    Role = "admin",
                    JoinedAt = DateTime.UtcNow
                };
                context.BoardMembers.Add(bobMembership);
            }

            // Add viewer as viewer to public board
            if (viewer != null)
            {
                var viewerMembership = new BoardMember
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = publicBoard.Id,
                    UserId = viewer.Id,
                    Role = "viewer",
                    JoinedAt = DateTime.UtcNow
                };
                context.BoardMembers.Add(viewerMembership);
            }

            // Create columns and cards for public board
            var columns = new[]
            {
                new Column
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Backlog",
                    BoardId = publicBoard.Id,
                    Created = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow
                },
                new Column
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "In Progress",
                    BoardId = publicBoard.Id,
                    Created = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow
                },
                new Column
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Done",
                    BoardId = publicBoard.Id,
                    Created = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow
                }
            };

            foreach (var column in columns)
            {
                context.Columns.Add(column);
            }

            publicBoard.ColumnOrderIds = columns.Select(c => c.Id).ToList();

            // Create sample cards
            var cards = new[]
            {
                new Card
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Setup Authentication System",
                    Description = "Implement JWT authentication with role-based permissions",
                    BoardId = publicBoard.Id,
                    ColumnId = columns[0].Id,
                    Created = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow
                },
                new Card
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Design Board Management",
                    Description = "Create board CRUD operations with proper permissions",
                    BoardId = publicBoard.Id,
                    ColumnId = columns[1].Id,
                    Created = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow
                },
                new Card
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Implement Drag & Drop",
                    Description = "Add drag and drop functionality for cards",
                    BoardId = publicBoard.Id,
                    ColumnId = columns[2].Id,
                    Created = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow
                }
            };

            foreach (var card in cards)
            {
                context.Cards.Add(card);
            }

            // Update column card orders
            columns[0].CardOrderIds = new List<string> { cards[0].Id };
            columns[1].CardOrderIds = new List<string> { cards[1].Id };
            columns[2].CardOrderIds = new List<string> { cards[2].Id };

            await context.SaveChangesAsync();
        }
    }
}