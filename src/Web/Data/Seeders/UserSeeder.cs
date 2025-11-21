using Microsoft.AspNetCore.Identity;
using ProjectManagement.Models.Domain.Entities;

namespace ProjectManagement.Data.Seeders
{
    public static class UserSeeder
    {
        public static async Task<List<(ApplicationUser User, string Role)>> SeedUsers(
            UserManager<ApplicationUser> userManager,
            IServiceProvider serviceProvider)
        {
            var sampleUsers = new[]
            {
                new
                {
                    Email = "superadmin@test.com",
                    UserName = "superadmin",
                    Password = "Test123!",
                    Role = "SuperAdmin"
                },
                new { Email = "admin@test.com", UserName = "admin", Password = "Test123!", Role = "Admin" },
                new { Email = "alice@test.com", UserName = "alice", Password = "Test123!", Role = "User" },
                new { Email = "bob@test.com", UserName = "bob", Password = "Test123!", Role = "User" },
                new { Email = "viewer@test.com", UserName = "viewer", Password = "Test123!", Role = "User" }
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
                        try
                        {
                            var roleExists = await userManager.IsInRoleAsync(user, userData.Role);
                            if (!roleExists)
                            {
                                await userManager.AddToRoleAsync(user, userData.Role);
                            }
                            createdUsers.Add((user, userData.Role));
                        }
                        catch (Exception ex)
                        {
                            var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
                            logger.LogWarning(ex, $"Skipping role assignment for user '{userData.Email}' — role '{userData.Role}' not found.");
                        }
                    }
                }
                else
                {
                    var roles = await userManager.GetRolesAsync(existingUser);
                    createdUsers.Add((existingUser, roles.FirstOrDefault() ?? "User"));
                }
            }

            return createdUsers;
        }
    }
}
