using ProjectManagement.Models.Domain.Common;

namespace ProjectManagement.Models.Domain.Entities
{
    public class CardLabel : BaseEntity
    {
        public string CardId { get; set; } = string.Empty;
        public string LabelId { get; set; } = string.Empty;
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual Card Card { get; set; } = null!;
        public virtual Label Label { get; set; } = null!;
    }
}