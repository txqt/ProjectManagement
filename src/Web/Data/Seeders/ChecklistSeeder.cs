using ProjectManagement.Models.Domain.Entities;

namespace ProjectManagement.Data.Seeders
{
    public static class ChecklistSeeder
    {
        public static async Task SeedChecklists(
            ApplicationDbContext context,
            Card[] cards,
            ApplicationUser alice,
            ApplicationUser? bob)
        {
            var checklists = new[]
            {
                new Checklist
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[0].Id,
                    Title = "Authentication Tasks",
                    Position = 0,
                    CreatedAt = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow
                },
                new Checklist
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[1].Id,
                    Title = "Board Features",
                    Position = 0,
                    CreatedAt = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow
                },
                new Checklist
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[2].Id,
                    Title = "UI Components",
                    Position = 0,
                    CreatedAt = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow
                }
            };

            foreach (var checklist in checklists)
            {
                context.Checklists.Add(checklist);
            }

            await context.SaveChangesAsync();

            // Seed checklist items
            var checklistItems = new[]
            {
                // Authentication Tasks checklist items
                new ChecklistItem
                {
                    Id = Guid.NewGuid().ToString(),
                    ChecklistId = checklists[0].Id,
                    Title = "Setup JWT configuration",
                    IsCompleted = true,
                    Position = 0,
                    CompletedAt = DateTime.UtcNow.AddDays(-2),
                    CompletedBy = alice.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    LastModified = DateTime.UtcNow.AddDays(-2)
                },
                new ChecklistItem
                {
                    Id = Guid.NewGuid().ToString(),
                    ChecklistId = checklists[0].Id,
                    Title = "Implement login endpoint",
                    IsCompleted = true,
                    Position = 1,
                    CompletedAt = DateTime.UtcNow.AddDays(-1),
                    CompletedBy = bob?.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    LastModified = DateTime.UtcNow.AddDays(-1)
                },
                new ChecklistItem
                {
                    Id = Guid.NewGuid().ToString(),
                    ChecklistId = checklists[0].Id,
                    Title = "Add role-based authorization",
                    IsCompleted = false,
                    Position = 2,
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    LastModified = DateTime.UtcNow.AddDays(-5)
                },
                new ChecklistItem
                {
                    Id = Guid.NewGuid().ToString(),
                    ChecklistId = checklists[0].Id,
                    Title = "Write authentication tests",
                    IsCompleted = false,
                    Position = 3,
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    LastModified = DateTime.UtcNow.AddDays(-5)
                },
                // Board Features checklist items
                new ChecklistItem
                {
                    Id = Guid.NewGuid().ToString(),
                    ChecklistId = checklists[1].Id,
                    Title = "Create board model",
                    IsCompleted = true,
                    Position = 0,
                    CompletedAt = DateTime.UtcNow.AddDays(-3),
                    CompletedBy = alice.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-4),
                    LastModified = DateTime.UtcNow.AddDays(-3)
                },
                new ChecklistItem
                {
                    Id = Guid.NewGuid().ToString(),
                    ChecklistId = checklists[1].Id,
                    Title = "Implement CRUD operations",
                    IsCompleted = false,
                    Position = 1,
                    CreatedAt = DateTime.UtcNow.AddDays(-4),
                    LastModified = DateTime.UtcNow.AddDays(-4)
                },
                new ChecklistItem
                {
                    Id = Guid.NewGuid().ToString(),
                    ChecklistId = checklists[1].Id,
                    Title = "Add permission checks",
                    IsCompleted = false,
                    Position = 2,
                    CreatedAt = DateTime.UtcNow.AddDays(-4),
                    LastModified = DateTime.UtcNow.AddDays(-4)
                },
                // UI Components checklist items
                new ChecklistItem
                {
                    Id = Guid.NewGuid().ToString(),
                    ChecklistId = checklists[2].Id,
                    Title = "Install drag-drop library",
                    IsCompleted = true,
                    Position = 0,
                    CompletedAt = DateTime.UtcNow.AddHours(-6),
                    CompletedBy = bob?.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    LastModified = DateTime.UtcNow.AddHours(-6)
                },
                new ChecklistItem
                {
                    Id = Guid.NewGuid().ToString(),
                    ChecklistId = checklists[2].Id,
                    Title = "Create draggable card component",
                    IsCompleted = true,
                    Position = 1,
                    CompletedAt = DateTime.UtcNow.AddHours(-3),
                    CompletedBy = bob?.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    LastModified = DateTime.UtcNow.AddHours(-3)
                },
                new ChecklistItem
                {
                    Id = Guid.NewGuid().ToString(),
                    ChecklistId = checklists[2].Id,
                    Title = "Add animations",
                    IsCompleted = false,
                    Position = 2,
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    LastModified = DateTime.UtcNow.AddDays(-1)
                }
            };

            foreach (var item in checklistItems)
            {
                context.ChecklistItems.Add(item);
            }

            await context.SaveChangesAsync();
        }
    }
}
