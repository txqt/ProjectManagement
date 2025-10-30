namespace ProjectManagement.Models.DTOs.Activity
{
    public class ActivityLogDto
    {
        public string Id { get; set; } = string.Empty;
        public string BoardId { get; set; } = string.Empty;
        public string? CardId { get; set; }
        public string? ColumnId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string? EntityId { get; set; }
        public string? Description { get; set; }
        public Dictionary<string, object>? Metadata { get; set; }
        public DateTime CreatedAt { get; set; }

        // User info
        public required UserDto User { get; set; }

        // Optional entity details
        public string? CardTitle { get; set; }
        public string? ColumnTitle { get; set; }
    }
}