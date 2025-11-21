using ProjectManagement.Models.Domain.Entities;

namespace ProjectManagement.Data.Seeders
{
    public static class LabelSeeder
    {
        public static async Task<Label[]> SeedLabels(ApplicationDbContext context, string boardId)
        {
            var labels = new[]
            {
                new Label
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = boardId,
                    Title = "Bug",
                    Color = "#e74c3c",
                    CreatedAt = DateTime.UtcNow
                },
                new Label
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = boardId,
                    Title = "Feature",
                    Color = "#3498db",
                    CreatedAt = DateTime.UtcNow
                },
                new Label
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = boardId,
                    Title = "Enhancement",
                    Color = "#2ecc71",
                    CreatedAt = DateTime.UtcNow
                },
                new Label
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = boardId,
                    Title = "Documentation",
                    Color = "#f39c12",
                    CreatedAt = DateTime.UtcNow
                },
                new Label
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = boardId,
                    Title = "High Priority",
                    Color = "#e67e22",
                    CreatedAt = DateTime.UtcNow
                }
            };

            foreach (var label in labels)
            {
                context.Labels.Add(label);
            }

            await context.SaveChangesAsync();
            return labels;
        }

        public static async Task SeedCardLabels(ApplicationDbContext context, Card[] cards, Label[] labels)
        {
            var cardLabels = new[]
            {
                new CardLabel
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[0].Id,
                    LabelId = labels[1].Id, // Feature
                    AssignedAt = DateTime.UtcNow
                },
                new CardLabel
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[0].Id,
                    LabelId = labels[4].Id, // High Priority
                    AssignedAt = DateTime.UtcNow
                },
                new CardLabel
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[1].Id,
                    LabelId = labels[2].Id, // Enhancement
                    AssignedAt = DateTime.UtcNow
                },
                new CardLabel
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[2].Id,
                    LabelId = labels[1].Id, // Feature
                    AssignedAt = DateTime.UtcNow
                }
            };

            foreach (var cardLabel in cardLabels)
            {
                context.CardLabels.Add(cardLabel);
            }

            await context.SaveChangesAsync();
        }
    }
}
