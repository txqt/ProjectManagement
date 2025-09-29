using Infrastructure;
using Microsoft.AspNetCore.Identity;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;

namespace ProjectManagement.Data
{
    public static class DataSeeder
    {
        public static async Task InitializeDatabase(WebApplication app)
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
                    Permissions.GetAllPermissions().ToArray()
                },
                {
                    "Admin",
                    new[]
                    {
                        Permissions.System.ViewAllUsers,
                        Permissions.System.ViewSystemStats,
                        Permissions.Boards.Create,
                        Permissions.Boards.View,
                        Permissions.Boards.Edit,
                    }
                    .Concat(Permissions.GetBoardLevelPermissions().Where(p => p != Permissions.Boards.Delete))
                    .ToArray()
                },
                {
                    "User",
                    new[]
                    {
                        Permissions.Boards.Create,
                        Permissions.Boards.View,
                        Permissions.Columns.View,
                        Permissions.Cards.View,
                        Permissions.Cards.Create,
                        Permissions.Cards.Edit,
                        Permissions.Cards.Comment,
                    }
                },
                {
                    "Viewer",
                    new[]
                    {
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

                    foreach (var permission in permissions)
                    {
                        await roleManager.AddClaimAsync(role, new System.Security.Claims.Claim("permission", permission));
                    }
                }
            }
        }

        static async Task SeedSampleData(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
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

            if (!context.Boards.Any() && createdUsers.Any())
            {
                var alice = createdUsers.FirstOrDefault(u => u.User.UserName == "alice").User;
                var bob = createdUsers.FirstOrDefault(u => u.User.UserName == "bob").User;
                var viewer = createdUsers.FirstOrDefault(u => u.User.UserName == "viewer").User;

                if (alice != null)
                {
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

                    if (bob != null)
                    {
                        context.BoardMembers.Add(new BoardMember
                        {
                            Id = Guid.NewGuid().ToString(),
                            BoardId = publicBoard.Id,
                            UserId = bob.Id,
                            Role = "admin",
                            JoinedAt = DateTime.UtcNow
                        });
                    }

                    if (viewer != null)
                    {
                        context.BoardMembers.Add(new BoardMember
                        {
                            Id = Guid.NewGuid().ToString(),
                            BoardId = publicBoard.Id,
                            UserId = viewer.Id,
                            Role = "viewer",
                            JoinedAt = DateTime.UtcNow
                        });
                    }

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

                    columns[0].CardOrderIds = new List<string> { cards[0].Id };
                    columns[1].CardOrderIds = new List<string> { cards[1].Id };
                    columns[2].CardOrderIds = new List<string> { cards[2].Id };

                    await context.SaveChangesAsync();
                }
            }
        }
    }
}