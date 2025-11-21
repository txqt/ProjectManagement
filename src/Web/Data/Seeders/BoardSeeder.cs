using ProjectManagement.Models.Common;
using ProjectManagement.Models.Domain.Entities;

namespace ProjectManagement.Data.Seeders
{
    public static class BoardSeeder
    {
        public static async Task<(Board privateBoard, Board publicBoard, Column[] columns, Card[] cards)> SeedBoards(
            ApplicationDbContext context,
            ApplicationUser alice,
            ApplicationUser? bob,
            ApplicationUser? viewer)
        {
            var privateBoard = new Board
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Alice's Private Project",
                Description = "A private board owned by Alice",
                Type = BoardType.Private,
                OwnerId = alice.Id,
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };
            context.Boards.Add(privateBoard);

            var publicBoard = new Board
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Team Collaboration Board",
                Description = "A public board for team collaboration",
                Type = BoardType.Public,
                OwnerId = alice.Id,
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };
            context.Boards.Add(publicBoard);

            // Add board members
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

            // Create columns
            var columns = new[]
            {
                new Column
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Backlog",
                    BoardId = publicBoard.Id,
                    CreatedAt = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow
                },
                new Column
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "In Progress",
                    BoardId = publicBoard.Id,
                    CreatedAt = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow
                },
                new Column
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Done",
                    BoardId = publicBoard.Id,
                    CreatedAt = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow
                }
            };

            foreach (var column in columns)
            {
                context.Columns.Add(column);
            }

            // Create cards
            var cards = new[]
            {
                new Card
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Setup Authentication System",
                    Description = "Implement JWT authentication with role-based permissions",
                    BoardId = publicBoard.Id,
                    ColumnId = columns[0].Id,
                    CreatedAt = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow
                },
                new Card
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Design Board Management",
                    Description = "Create board CRUD operations with proper permissions",
                    BoardId = publicBoard.Id,
                    ColumnId = columns[1].Id,
                    CreatedAt = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow
                },
                new Card
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Implement Drag & Drop",
                    Description = "Add drag and drop functionality for cards",
                    BoardId = publicBoard.Id,
                    ColumnId = columns[2].Id,
                    CreatedAt = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow
                }
            };

            foreach (var card in cards)
            {
                context.Cards.Add(card);
            }

            await context.SaveChangesAsync();

            return (privateBoard, publicBoard, columns, cards);
        }
    }
}
