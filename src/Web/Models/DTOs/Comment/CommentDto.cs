namespace ProjectManagement.Models.DTOs.Comment
{
    public class CommentDto
    {
        public string Id { get; set; } = string.Empty;
        public string CardId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public UserDto User { get; set; } = null!;
    }
}
