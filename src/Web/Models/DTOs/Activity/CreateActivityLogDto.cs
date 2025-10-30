namespace ProjectManagement.Models.DTOs.Activity
{
    public class CreateActivityLogDto
    {
        public string BoardId { get; set; } = string.Empty;
        public string? CardId { get; set; }
        public string? ColumnId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string? EntityId { get; set; }
        public string? Description { get; set; }
        public Dictionary<string, object>? Metadata { get; set; }
    }
}