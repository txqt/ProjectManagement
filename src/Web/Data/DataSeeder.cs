using ProjectManagement.Data;
using Microsoft.AspNetCore.Identity;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Common;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Services;
using ProjectManagement.Data.Seeders;

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
                var lexoRankMigrationService = services.GetRequiredService<LexoRankMigrationService>();

                // Ensure database is created
                await context.Database.EnsureCreatedAsync();

                // Create roles
                await RoleSeeder.SeedRoles(roleManager);

                // Seed sample data
                await SampleDataSeeder.SeedData(context, userManager, services);

                await lexoRankMigrationService.MigrateToLexoRankAsync();
            }
            catch (Exception ex)
            {
                var logger = services.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "An error occurred while initializing the database.");
            }
        }
    }
}