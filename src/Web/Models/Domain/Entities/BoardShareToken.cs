using ProjectManagement.Models.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.Domain.Entities
{
    public class BoardShareToken : BaseEntity
    {
        [Required]
        public string BoardId { get; set; } = string.Empty;

        [Required]
        [MaxLength(64)]
        public string Token { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(30);

        public bool IsActive { get; set; } = true;

        // Navigation
        public virtual Board Board { get; set; } = null!;
    }
}