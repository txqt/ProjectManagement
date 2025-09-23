using ProjectManagement.Models.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.Domain.Entities
{
    public class Comment : BaseAuditableEntity
    {
        [Required]
        public string CardId { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        // Navigation properties
        public virtual Card Card { get; set; } = null!;
        public virtual ApplicationUser User { get; set; } = null!;
    }
}
