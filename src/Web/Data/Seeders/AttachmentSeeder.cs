using ProjectManagement.Models.Domain.Entities;

namespace ProjectManagement.Data.Seeders
{
    public static class AttachmentSeeder
    {
        public static async Task<Attachment[]> SeedAttachments(ApplicationDbContext context, Card[] cards)
        {
            var attachments = new[]
            {
                new Attachment
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[0].Id,
                    Name = "authentication-flow.png",
                    Url = "/uploads/attachments/auth-flow-diagram.png",
                    Type = "image",
                    CreatedAt = DateTime.UtcNow.AddDays(-4),
                    LastModified = DateTime.UtcNow.AddDays(-4)
                },
                new Attachment
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[0].Id,
                    Name = "jwt-implementation-guide.pdf",
                    Url = "/uploads/attachments/jwt-guide.pdf",
                    Type = "doc",
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    LastModified = DateTime.UtcNow.AddDays(-3)
                },
                new Attachment
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[1].Id,
                    Name = "board-wireframe.png",
                    Url = "/uploads/attachments/board-wireframe.png",
                    Type = "image",
                    CreatedAt = DateTime.UtcNow.AddDays(-2),
                    LastModified = DateTime.UtcNow.AddDays(-2)
                },
                new Attachment
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[1].Id,
                    Name = "api-specification.json",
                    Url = "/uploads/attachments/api-spec.json",
                    Type = "file",
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    LastModified = DateTime.UtcNow.AddDays(-1)
                },
                new Attachment
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[2].Id,
                    Name = "drag-drop-demo.gif",
                    Url = "/uploads/attachments/dnd-demo.gif",
                    Type = "image",
                    CreatedAt = DateTime.UtcNow.AddHours(-8),
                    LastModified = DateTime.UtcNow.AddHours(-8)
                }
            };

            foreach (var attachment in attachments)
            {
                context.Attachments.Add(attachment);
            }

            await context.SaveChangesAsync();
            return attachments;
        }
    }
}
