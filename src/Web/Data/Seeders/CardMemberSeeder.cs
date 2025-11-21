using ProjectManagement.Models.Domain.Entities;

namespace ProjectManagement.Data.Seeders
{
    public static class CardMemberSeeder
    {
        public static async Task SeedCardMembers(
            ApplicationDbContext context,
            Card[] cards,
            ApplicationUser alice,
            ApplicationUser? bob)
        {
            if (bob == null) return;

            var cardMembers = new[]
            {
                new CardMember
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[0].Id,
                    UserId = bob.Id,
                    AssignedAt = DateTime.UtcNow
                },
                new CardMember
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[1].Id,
                    UserId = alice.Id,
                    AssignedAt = DateTime.UtcNow
                },
                new CardMember
                {
                    Id = Guid.NewGuid().ToString(),
                    CardId = cards[1].Id,
                    UserId = bob.Id,
                    AssignedAt = DateTime.UtcNow
                }
            };

            foreach (var cardMember in cardMembers)
            {
                context.CardMembers.Add(cardMember);
            }

            await context.SaveChangesAsync();
        }
    }
}
