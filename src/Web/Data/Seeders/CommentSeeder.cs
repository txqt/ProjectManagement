using ProjectManagement.Models.Domain.Entities;

namespace ProjectManagement.Data.Seeders
{
    public static class CommentSeeder
    {
        public static async Task<Comment[]> SeedComments(
            ApplicationDbContext context,
            Card[] cards,
            ApplicationUser alice,
            ApplicationUser? bob,
            ApplicationUser? viewer)
        {
            var comments = new[]
            {
                new Comment
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[0].Id,
                    UserId = alice.Id,
                    Content = "We should use ASP.NET Core Identity for this. It has built-in support for JWT.",
                    CreatedAt = DateTime.UtcNow.AddDays(-4),
                    LastModified = DateTime.UtcNow.AddDays(-4)
                },
                new Comment
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[0].Id,
                    UserId = bob?.Id ?? alice.Id,
                    Content = "Good idea! I'll also add refresh token support for better security.",
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    LastModified = DateTime.UtcNow.AddDays(-3)
                },
                new Comment
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[1].Id,
                    UserId = alice.Id,
                    Content = "Don't forget to implement proper authorization checks for board ownership and membership.",
                    CreatedAt = DateTime.UtcNow.AddDays(-2),
                    LastModified = DateTime.UtcNow.AddDays(-2)
                },
                new Comment
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[1].Id,
                    UserId = bob?.Id ?? alice.Id,
                    Content = "Already on it! Using policy-based authorization.",
                    CreatedAt = DateTime.UtcNow.AddDays(-2).AddHours(2),
                    LastModified = DateTime.UtcNow.AddDays(-2).AddHours(2)
                },
                new Comment
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[2].Id,
                    UserId = bob?.Id ?? alice.Id,
                    Content = "I'm thinking of using react-beautiful-dnd for this. It has great touch support.",
                    CreatedAt = DateTime.UtcNow.AddHours(-12),
                    LastModified = DateTime.UtcNow.AddHours(-12)
                },
                new Comment
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[2].Id,
                    UserId = viewer?.Id ?? alice.Id,
                    Content = "Sounds good! Make sure it works well on mobile devices too.",
                    CreatedAt = DateTime.UtcNow.AddHours(-10),
                    LastModified = DateTime.UtcNow.AddHours(-10)
                }
            };

            foreach (var comment in comments)
            {
                context.Comments.Add(comment);
            }

            await context.SaveChangesAsync();
            return comments;
        }
    }
}
