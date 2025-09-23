using Microsoft.AspNetCore.Identity;

namespace ProjectManagement.Models.Domain.Entities
{
    public class ApplicationUser : IdentityUser
    {
        public string? Avatar { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation properties
        public virtual ICollection<Board> OwnedBoards { get; set; } = new List<Board>();
        public virtual ICollection<BoardMember> BoardMemberships { get; set; } = new List<BoardMember>();
        public virtual ICollection<CardMember> CardMemberships { get; set; } = new List<CardMember>();
        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
    }
}
