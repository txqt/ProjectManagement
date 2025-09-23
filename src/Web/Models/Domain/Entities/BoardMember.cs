using ProjectManagement.Models.Domain.Common;

namespace ProjectManagement.Models.Domain.Entities
{
    public class BoardMember : BaseEntity
    {
        public string BoardId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Role { get; set; } = "member"; // owner, admin, member
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Board Board { get; set; } = null!;
        public virtual ApplicationUser User { get; set; } = null!;
    }
}
