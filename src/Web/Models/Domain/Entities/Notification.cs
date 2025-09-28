using ProjectManagement.Models.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.Domain.Entities
{
    public class Notification : BaseAuditableEntity
    {
        [Required]
        public string UserId { get; set; } = string.Empty; // Người nhận notification

        [Required]
        public string Type { get; set; } = string.Empty; // board_invite, card_assigned, comment_added, etc.

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Message { get; set; }

        public string? ActionUrl { get; set; } // URL để redirect khi click

        // JSON data for additional info
        public string? Data { get; set; } // JSON string chứa thông tin bổ sung

        public bool IsRead { get; set; } = false;

        public DateTime? ReadAt { get; set; }

        // Related entity IDs for easier querying
        public string? BoardId { get; set; }
        public string? CardId { get; set; }
        public string? InviteId { get; set; }

        // Navigation properties
        public virtual ApplicationUser User { get; set; } = null!;
        public virtual Board? Board { get; set; }
        public virtual Card? Card { get; set; }
        public virtual BoardInvite? Invite { get; set; }
    }
}
