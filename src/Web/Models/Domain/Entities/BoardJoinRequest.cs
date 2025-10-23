using ProjectManagement.Models.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.Domain.Entities
{
    public class BoardJoinRequest : BaseAuditableEntity
    {
        [Required]
        public string BoardId { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string Status { get; set; } = JoinRequestStatus.Pending;

        public string? Message { get; set; }

        public DateTime? RespondedAt { get; set; }

        public string? RespondedBy { get; set; } // Admin/Owner who responded

        // Navigation properties
        public virtual Board Board { get; set; } = null!;
        public virtual ApplicationUser User { get; set; } = null!;
        public virtual ApplicationUser? Responder { get; set; }
    }
}