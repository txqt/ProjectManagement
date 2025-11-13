using ProjectManagement.Models.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.Domain.Entities
{
    public class ChecklistItem : BaseAuditableEntity
    {
        [Required]
        public string ChecklistId { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Title { get; set; } = string.Empty;

        public bool IsCompleted { get; set; } = false;

        public int Position { get; set; } = 0;

        public DateTime? CompletedAt { get; set; }

        public string? CompletedBy { get; set; }

        // Navigation
        public virtual Checklist Checklist { get; set; } = null!;
        public virtual ApplicationUser? CompletedByUser { get; set; }
    }
}