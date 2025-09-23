using ProjectManagement.Models.Domain.Common;

namespace ProjectManagement.Models.Domain.Entities
{
    public class CardMember : BaseEntity
    {
        public string CardId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Card Card { get; set; } = null!;
        public virtual ApplicationUser User { get; set; } = null!;
    }
}
