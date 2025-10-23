using ProjectManagement.Models.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.Domain.Entities
{
    public class Board : BaseAuditableEntity
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public string Type { get; set; } = "public"; // public, private

        [Required]
        public string OwnerId { get; set; } = string.Empty;
        
        public string? Cover { get; set; }

        public bool AllowShareInviteLink { get; set; } = true;

        public bool AllowCommentsOnCard { get; set; } = true;
        
        public bool AllowAttachmentsOnCard { get; set; } = true;

        // Navigation properties
        public virtual ApplicationUser Owner { get; set; } = null!;
        public virtual ICollection<Column> Columns { get; set; } = new List<Column>();
        public virtual ICollection<BoardMember> Members { get; set; } = new List<BoardMember>();
        public virtual ICollection<BoardInvite> Invites { get; set; } = new List<BoardInvite>();
        
        public virtual ICollection<BoardJoinRequest> JoinRequests { get; set; } = new List<BoardJoinRequest>();
    }
}
