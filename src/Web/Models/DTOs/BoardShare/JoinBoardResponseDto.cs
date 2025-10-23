namespace ProjectManagement.Models.DTOs.BoardShare
{
    public class JoinBoardResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string BoardId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty; // auto_joined | request_created | already_member | request_exists
    }
}