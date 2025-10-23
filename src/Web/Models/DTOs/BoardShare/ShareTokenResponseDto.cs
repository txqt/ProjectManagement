namespace ProjectManagement.Models.DTOs.BoardShare
{
    public class ShareTokenResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public string ShareUrl { get; set; } = string.Empty;
    }
}