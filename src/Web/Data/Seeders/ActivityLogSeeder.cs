using ProjectManagement.Models.Domain.Entities;

namespace ProjectManagement.Data.Seeders
{
    public static class ActivityLogSeeder
    {
        public static async Task SeedActivityLogs(
            ApplicationDbContext context,
            Board publicBoard,
            Column[] columns,
            Card[] cards,
            Comment[] comments,
            Attachment[] attachments,
            ApplicationUser alice,
            ApplicationUser? bob)
        {
            var activityLogs = new[]
            {
                new ActivityLog
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = publicBoard.Id,
                    UserId = alice.Id,
                    Action = ActivityActions.Created,
                    EntityType = ActivityEntityTypes.Board,
                    EntityId = publicBoard.Id,
                    Description = "Created board 'Team Collaboration Board'",
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    LastModified = DateTime.UtcNow.AddDays(-5)
                },
                new ActivityLog
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = publicBoard.Id,
                    ColumnId = columns[0].Id,
                    UserId = alice.Id,
                    Action = ActivityActions.Created,
                    EntityType = ActivityEntityTypes.Column,
                    EntityId = columns[0].Id,
                    Description = "Created column 'Backlog'",
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    LastModified = DateTime.UtcNow.AddDays(-5)
                },
                new ActivityLog
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = publicBoard.Id,
                    CardId = cards[0].Id,
                    UserId = alice.Id,
                    Action = ActivityActions.Created,
                    EntityType = ActivityEntityTypes.Card,
                    EntityId = cards[0].Id,
                    Description = "Created card 'Setup Authentication System'",
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    LastModified = DateTime.UtcNow.AddDays(-5)
                },
                new ActivityLog
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = publicBoard.Id,
                    CardId = cards[1].Id,
                    UserId = bob?.Id ?? alice.Id,
                    Action = ActivityActions.Moved,
                    EntityType = ActivityEntityTypes.Card,
                    EntityId = cards[1].Id,
                    Description = "Moved card from 'Backlog' to 'In Progress'",
                    Metadata = "{\"from\":\"Backlog\",\"to\":\"In Progress\"}",
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    LastModified = DateTime.UtcNow.AddDays(-3)
                },
                new ActivityLog
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = publicBoard.Id,
                    CardId = cards[0].Id,
                    UserId = bob?.Id ?? alice.Id,
                    Action = ActivityActions.Created,
                    EntityType = ActivityEntityTypes.Comment,
                    EntityId = comments[1].Id,
                    Description = "Added a comment",
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    LastModified = DateTime.UtcNow.AddDays(-3)
                },
                new ActivityLog
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = publicBoard.Id,
                    CardId = cards[2].Id,
                    UserId = bob?.Id ?? alice.Id,
                    Action = ActivityActions.Moved,
                    EntityType = ActivityEntityTypes.Card,
                    EntityId = cards[2].Id,
                    Description = "Moved card from 'In Progress' to 'Done'",
                    Metadata = "{\"from\":\"In Progress\",\"to\":\"Done\"}",
                    CreatedAt = DateTime.UtcNow.AddHours(-6),
                    LastModified = DateTime.UtcNow.AddHours(-6)
                },
                new ActivityLog
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = publicBoard.Id,
                    UserId = bob?.Id ?? alice.Id,
                    Action = ActivityActions.Created,
                    EntityType = ActivityEntityTypes.Member,
                    EntityId = bob?.Id,
                    Description = "Bob joined the board as admin",
                    CreatedAt = DateTime.UtcNow.AddDays(-4),
                    LastModified = DateTime.UtcNow.AddDays(-4)
                },
                new ActivityLog
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = publicBoard.Id,
                    CardId = cards[0].Id,
                    UserId = alice.Id,
                    Action = ActivityActions.Created,
                    EntityType = ActivityEntityTypes.Attachment,
                    EntityId = attachments[0].Id,
                    Description = "Added attachment 'authentication-flow.png'",
                    CreatedAt = DateTime.UtcNow.AddDays(-4),
                    LastModified = DateTime.UtcNow.AddDays(-4)
                }
            };

            foreach (var log in activityLogs)
            {
                context.ActivityLogs.Add(log);
            }

            await context.SaveChangesAsync();
        }
    }
}
