using ProjectManagement.Models.DTOs.Board;

namespace ProjectManagement.Models.DTOs.BoardJoinRequest
{
    public class BoardJoinRequestDto
    {
        public string Id { get; set; } = string.Empty;
        public string BoardId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // pending, approved, rejected
        public string? Message { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
        public string? RespondedBy { get; set; }

        // Navigation properties
        public BoardDto Board { get; set; } = null!;
        public UserDto User { get; set; } = null!;
        public UserDto? Responder { get; set; }
    }
}