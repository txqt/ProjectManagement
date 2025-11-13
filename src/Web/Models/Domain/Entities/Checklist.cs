using ProjectManagement.Models.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.Domain.Entities
{
    public class Checklist : BaseAuditableEntity
    {
        [Required]
        public string CardId { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public int Position { get; set; } = 0;

        // Navigation
        public virtual Card Card { get; set; } = null!;
        public virtual ICollection<ChecklistItem> Items { get; set; } = new List<ChecklistItem>();
    }
}