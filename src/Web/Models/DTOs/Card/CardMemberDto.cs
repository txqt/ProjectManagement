namespace ProjectManagement.Models.DTOs.Card
{
    public class CardMemberDto
    {
        public string Id { get; set; } = string.Empty;
        public string CardId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime AssignedAt { get; set; }
        
        public UserDto  User { get; set; }
    }
}