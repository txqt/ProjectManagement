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
        
        [Required]
        [MaxLength(255)]
        public string Rank { get; set; } = string.Empty;

        // Navigation properties
        public virtual Board Board { get; set; } = null!;
        public virtual Column Column { get; set; } = null!;
        public virtual ICollection<CardMember> Members { get; set; } = new List<CardMember>();
        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
        public virtual ICollection<CardLabel> Labels { get; set; } = new List<CardLabel>();
        public virtual ICollection<Checklist> Checklists { get; set; } = new List<Checklist>();
    }
}
