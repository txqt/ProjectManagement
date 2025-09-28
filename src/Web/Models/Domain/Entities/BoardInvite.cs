using ProjectManagement.Models.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.Domain.Entities
{
    public class BoardInvite : BaseAuditableEntity
    {
        [Required]
        public string BoardId { get; set; } = string.Empty;

        [Required]
        public string InviterId { get; set; } = string.Empty; // Người gửi lời mời

        [Required]
        [EmailAddress]
        public string InviteeEmail { get; set; } = string.Empty; // Email người được mời

        public string? InviteeId { get; set; } // ID người được mời (nếu đã có account)

        [Required]
        public string Role { get; set; } = "member"; // Role sẽ được gán

        public string Status { get; set; } = "pending"; // pending, accepted, declined, expired

        public string? Message { get; set; } // Tin nhắn kèm theo lời mời

        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(7); // Hết hạn sau 7 ngày
        public DateTime? RespondedAt { get; set; }

        // Navigation properties
        public virtual Board Board { get; set; } = null!;
        public virtual ApplicationUser Inviter { get; set; } = null!;
        public virtual ApplicationUser? Invitee { get; set; }
    }
}
