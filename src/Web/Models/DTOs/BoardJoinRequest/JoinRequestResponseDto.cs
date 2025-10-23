namespace ProjectManagement.Models.DTOs.BoardJoinRequest
{
    public class JoinRequestResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public BoardJoinRequestDto? Request { get; set; }
    }
}