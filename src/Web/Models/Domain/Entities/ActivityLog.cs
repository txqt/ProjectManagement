using ProjectManagement.Models.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.Domain.Entities
{
    public class ActivityLog : BaseAuditableEntity
    {
        [Required]
        public string BoardId { get; set; } = string.Empty;

        public string? CardId { get; set; }

        public string? ColumnId { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string Action { get; set; } = string.Empty; // created, updated, deleted, moved, etc.

        [Required]
        public string EntityType { get; set; } = string.Empty; // board, column, card, comment, attachment, member

        public string? EntityId { get; set; }

        public string? Description { get; set; }

        // JSON data for additional context
        public string? Metadata { get; set; } // JSON string: {"from": "Todo", "to": "Done"}

        // Navigation properties
        public virtual Board Board { get; set; } = null!;
        public virtual Card? Card { get; set; }
        public virtual Column? Column { get; set; }
        public virtual ApplicationUser User { get; set; } = null!;
    }
}