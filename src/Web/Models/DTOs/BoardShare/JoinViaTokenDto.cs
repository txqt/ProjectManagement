namespace ProjectManagement.Models.DTOs.BoardShare
{
    public class JoinViaTokenDto
    {
        public string Token { get; set; } = string.Empty;
        public string? Message { get; set; }
    }
}