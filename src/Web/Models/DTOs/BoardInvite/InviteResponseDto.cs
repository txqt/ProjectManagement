namespace ProjectManagement.Models.DTOs.BoardInvite
{
    public class InviteResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public BoardInviteDto? Invite { get; set; }
    }
}
