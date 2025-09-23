namespace ProjectManagement.Models.DTOs.Board
{
    public class BoardMemberDto
    {
        public string Id { get; set; } = string.Empty;
        public string BoardId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; }
        public UserDto User { get; set; } = null!;
    }
}
