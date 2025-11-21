using Microsoft.AspNetCore.Identity;
using ProjectManagement.Models.Domain.Entities;

namespace ProjectManagement.Data.Seeders
{
    public static class SampleDataSeeder
    {
        public static async Task SeedData(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            IServiceProvider serviceProvider)
        {
            // Seed users
            var createdUsers = await UserSeeder.SeedUsers(userManager, serviceProvider);

            if (!context.Boards.Any() && createdUsers.Any())
            {
                var alice = createdUsers.FirstOrDefault(u => u.User.UserName == "alice").User;
                var bob = createdUsers.FirstOrDefault(u => u.User.UserName == "bob").User;
                var viewer = createdUsers.FirstOrDefault(u => u.User.UserName == "viewer").User;

                if (alice != null)
                {
                    // Seed boards, columns, and cards
                    var (privateBoard, publicBoard, columns, cards) = await BoardSeeder.SeedBoards(
                        context, alice, bob, viewer);

                    // Seed labels and card labels
                    var labels = await LabelSeeder.SeedLabels(context, publicBoard.Id);
                    await LabelSeeder.SeedCardLabels(context, cards, labels);

                    // Seed card members
                    await CardMemberSeeder.SeedCardMembers(context, cards, alice, bob);

                    // Seed checklists and checklist items
                    await ChecklistSeeder.SeedChecklists(context, cards, alice, bob);

                    // Seed comments
                    var comments = await CommentSeeder.SeedComments(context, cards, alice, bob, viewer);

                    // Seed attachments
                    var attachments = await AttachmentSeeder.SeedAttachments(context, cards);

                    // Seed activity logs
                    await ActivityLogSeeder.SeedActivityLogs(
                        context, publicBoard, columns, cards, comments, attachments, alice, bob);
                }
            }

            // var migrationService = serviceProvider.GetRequiredService<LexoRankMigrationService>();
            // await migrationService.MigrateToLexoRankAsync();
        }
    }
}
