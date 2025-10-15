using ProjectManagement.Models.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.Domain.Entities
{
    public class Column : BaseAuditableEntity
    {
        [Required]
        public string BoardId { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Rank { get; set; } = string.Empty;

        // Navigation properties
        public virtual Board Board { get; set; } = null!;
        public virtual ICollection<Card> Cards { get; set; } = new List<Card>();
    }
}
