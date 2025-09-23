namespace ProjectManagement.Models.DTOs
{
    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
