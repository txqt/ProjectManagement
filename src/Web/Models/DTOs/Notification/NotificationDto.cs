namespace ProjectManagement.Models.DTOs.Notification
{
    public class NotificationDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Message { get; set; }
        public string? ActionUrl { get; set; }
        public Dictionary<string, object>? Data { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReadAt { get; set; }

        // Related entities
        public string? BoardId { get; set; }
        public string? CardId { get; set; }
        public string? InviteId { get; set; }

        // Optional navigation data
        public string? BoardTitle { get; set; }
        public string? CardTitle { get; set; }
    }
}
