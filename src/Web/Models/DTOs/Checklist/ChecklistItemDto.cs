namespace ProjectManagement.Models.DTOs.Checklist
{
    public class ChecklistItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string ChecklistId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public int Position { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? CompletedBy { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}