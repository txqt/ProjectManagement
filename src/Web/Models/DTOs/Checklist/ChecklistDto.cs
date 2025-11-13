namespace ProjectManagement.Models.DTOs.Checklist
{
    public class ChecklistDto
    {
        public string Id { get; set; } = string.Empty;
        public string CardId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int Position { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<ChecklistItemDto> Items { get; set; } = new();
    }
}