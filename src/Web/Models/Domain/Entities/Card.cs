using ProjectManagement.Models.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.Domain.Entities
{
    public class Card : BaseAuditableEntity
    {
        [Required]
        public string BoardId { get; set; } = string.Empty;

        [Required]
        public string ColumnId { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }
        public string? Cover { get; set; }

        // Navigation properties
        public virtual Board Board { get; set; } = null!;
        public virtual Column Column { get; set; } = null!;
        public virtual ICollection<CardMember> Members { get; set; } = new List<CardMember>();
        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    }
}
