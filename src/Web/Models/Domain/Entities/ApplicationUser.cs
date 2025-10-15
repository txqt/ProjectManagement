using Microsoft.AspNetCore.Identity;

namespace ProjectManagement.Models.Domain.Entities
{
    public class ApplicationUser : IdentityUser
    {
        public string? Avatar { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<Board> OwnedBoards { get; set; } = new List<Board>();
        public virtual ICollection<BoardMember> BoardMemberships { get; set; } = new List<BoardMember>();
        public virtual ICollection<CardMember> CardMemberships { get; set; } = new List<CardMember>();
        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}
