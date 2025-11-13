using ProjectManagement.Models.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.Domain.Entities
{
    public class Label : BaseEntity
    {
        [Required]
        public string BoardId { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Color { get; set; } = "#808080"; // Default gray

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual Board Board { get; set; } = null!;
        public virtual ICollection<CardLabel> CardLabels { get; set; } = new List<CardLabel>();
    }
}