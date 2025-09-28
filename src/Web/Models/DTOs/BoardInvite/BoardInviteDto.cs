using ProjectManagement.Models.DTOs.Board;

namespace ProjectManagement.Models.DTOs.BoardInvite
{
    public class BoardInviteDto
    {
        public string Id { get; set; } = string.Empty;
        public string BoardId { get; set; } = string.Empty;
        public string InviterId { get; set; } = string.Empty;
        public string InviteeEmail { get; set; } = string.Empty;
        public string? InviteeId { get; set; }
        public string Role { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Message { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime? RespondedAt { get; set; }

        // Navigation properties
        public BoardDto Board { get; set; } = null!;
        public UserDto Inviter { get; set; } = null!;
        public UserDto? Invitee { get; set; }
    }
}
